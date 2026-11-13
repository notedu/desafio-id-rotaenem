"""Geração, distribuição e consulta dos planos semanais."""

import logging
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import psycopg
from pymongo.collection import Collection

from app.repositories import conteudos as contents_repository
from app.repositories import estudos as studies_repository
from app.repositories import planos as plans_repository
from app.repositories.conteudos import MongoContentsUnavailableError
from app.schemas.plano import GeneratePlanInput, WeeklyPlanOutput
from app.services.desempenho import get_student_performance

logger = logging.getLogger(__name__)

DAY_ORDER = ("SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM")


class PlanPrerequisitesError(Exception):
    """A meta e o simulado mais recente são necessários para priorizar o plano."""


class WeeklyPlanNotFoundError(Exception):
    """Não existe plano salvo para a semana solicitada."""


class StudyScheduleTimeError(Exception):
    """O horário informado não comporta todas as sessões antes da meia-noite."""


def generate_student_plan(
    connection: psycopg.Connection,
    student: dict,
    collection: Collection | None,
    payload: GeneratePlanInput,
) -> dict:
    performance = get_student_performance(connection, student)
    if performance["meta"] is None or performance["simulado_atual"] is None:
        raise PlanPrerequisitesError

    week_start = payload.semana_inicio or _current_week_start()
    topics = plans_repository.get_topics(connection)
    areas = studies_repository.get_knowledge_areas(connection)
    if not areas:
        raise PlanPrerequisitesError

    performance_areas = {area["sigla"]: area for area in performance["areas"]}
    ranking = performance["ranking_prioridades"]
    priority_by_area = {item["sigla"]: item["prioridade"] for item in ranking}
    ranked_areas = [area for area in areas if area["sigla"] in performance_areas]
    topic_by_area: dict[str, list[dict]] = {area["sigla"]: [] for area in ranked_areas}
    for topic in topics:
        if topic["area_sigla"] in topic_by_area:
            topic_by_area[topic["area_sigla"]].append(topic)

    hours_by_area = _distribute_hours(payload.horas_semanais, ranked_areas, performance_areas)
    draft_sessions: list[dict] = []
    topic_indices: dict[str, int] = {area["sigla"]: 0 for area in ranked_areas}
    area_map = {area["sigla"]: area for area in areas}

    for area in ranked_areas:
        remaining = hours_by_area.get(area["sigla"], 0.0)
        area_topics = topic_by_area.get(area["sigla"], [])
        while remaining > 0:
            duration = min(1.5, remaining)
            topic = None
            if area_topics:
                topic = area_topics[topic_indices[area["sigla"]] % len(area_topics)]
                topic_indices[area["sigla"]] += 1
            draft_sessions.append({
                "area_id": area_map[area["sigla"]]["id"],
                "area_sigla": area["sigla"],
                "area_nome": area["nome"],
                "topico_id": topic["id"] if topic else None,
                "topico_nome": topic["nome"] if topic else None,
                "prioridade": float(priority_by_area.get(area["sigla"], 0)),
                "horas": duration,
                "content_key": (area["sigla"], topic["nome"]) if topic else None,
            })
            remaining = round(remaining - duration, 2)

    _assign_calendar(draft_sessions, payload.dias_disponiveis, payload.horario_inicio, week_start)
    content_by_topic: dict[tuple[str, str], dict | None] = {}
    content_error: str | None = None
    for session in draft_sessions:
        key = session["content_key"]
        if key is None or key in content_by_topic or content_error:
            continue
        try:
            content_by_topic[key] = contents_repository.find_content_for_topic(
                collection, key[0], key[1]
            )
        except MongoContentsUnavailableError:
            logger.exception("Falha ao buscar conteúdos para o plano no MongoDB.")
            content_error = "MongoDB indisponível; o plano foi salvo sem novos materiais."
            break

    for session in draft_sessions:
        key = session.pop("content_key")
        resource = content_by_topic.get(key) if key is not None else None
        session["conteudo_ref"] = resource["id"] if resource else None

    plans_repository.save_weekly_plan(
        connection,
        student["id"],
        week_start,
        draft_sessions,
    )
    saved_plan = plans_repository.get_weekly_plan(connection, student["id"], week_start)
    if saved_plan is None:
        raise WeeklyPlanNotFoundError
    return _serialize_plan(saved_plan, collection, content_error)


def read_student_plan(
    connection: psycopg.Connection,
    student_id: int,
    collection: Collection | None,
    week_start: date | None = None,
) -> dict:
    requested_week = week_start or _current_week_start()
    if requested_week.weekday() != 0:
        raise ValueError("semana_inicio deve ser uma segunda-feira.")
    plan = plans_repository.get_weekly_plan(connection, student_id, requested_week)
    if plan is None:
        raise WeeklyPlanNotFoundError
    return _serialize_plan(plan, collection, None)


def _serialize_plan(
    plan: dict,
    collection: Collection | None,
    content_error: str | None,
) -> dict:
    resource_ids = [
        session["conteudo_ref"]
        for session in plan["sessoes"]
        if session["conteudo_ref"] is not None
    ]
    resources: dict[str, dict] = {}
    if resource_ids and content_error is None:
        try:
            resources = contents_repository.get_contents_by_ids(collection, resource_ids)
        except MongoContentsUnavailableError:
            logger.exception("Falha ao carregar referências de conteúdo do MongoDB.")
            content_error = "MongoDB indisponível; materiais não puderam ser carregados."

    sessions = []
    for session in plan["sessoes"]:
        session_date = session["data"]
        session_day = DAY_ORDER[session_date.weekday()]
        content_id = session["conteudo_ref"]
        sessions.append({
            "id": session["id"],
            "data": session_date,
            "dia_semana": session_day,
            "horario_inicio": session["horario_inicio"],
            "horas": float(session["horas"]),
            "area_sigla": session["area_sigla"],
            "area_nome": session["area_nome"],
            "topico_id": session["topico_id"],
            "topico_nome": session["topico_nome"],
            "prioridade": float(session.get("prioridade", 0)),
            "conteudo": resources.get(content_id) if content_id else None,
        })

    total_hours = round(sum(session["horas"] for session in sessions), 2)
    available_content_count = sum(session["conteudo"] is not None for session in sessions)
    if content_error:
        content_message = content_error
    elif collection is None:
        content_message = "MongoDB não configurado; o plano foi salvo sem materiais."
    elif available_content_count == 0:
        content_message = "Nenhum conteúdo correspondente aos tópicos do plano foi encontrado."
    else:
        content_message = None

    return WeeklyPlanOutput(
        id=plan["id"],
        semana_inicio=plan["semana_inicio"],
        semana_fim=plan["semana_inicio"] + timedelta(days=6),
        horas_semanais=total_hours,
        criado_em=plan["criado_em"],
        conteudos_disponiveis=available_content_count > 0,
        mensagem_conteudos=content_message,
        sessoes=sessions,
    ).model_dump()


def _distribute_hours(
    total_hours: float,
    areas: list[dict],
    performance_areas: dict[str, dict],
) -> dict[str, float]:
    """Distribui blocos de meia hora proporcionalmente às prioridades."""
    units = round(total_hours * 2)
    weights = [
        max(float(performance_areas[area["sigla"]].get("prioridade") or 0), 0)
        for area in areas
    ]
    if not any(weights):
        weights = [
            max(float(performance_areas[area["sigla"]].get("peso") or 0), 1)
            for area in areas
        ]

    total_weight = sum(weights)
    exact_units = [units * weight / total_weight for weight in weights]
    assigned_units = [int(value) for value in exact_units]
    remaining_units = units - sum(assigned_units)
    remainder_order = sorted(
        range(len(areas)),
        key=lambda index: (-(exact_units[index] - assigned_units[index]), index),
    )
    for index in remainder_order[:remaining_units]:
        assigned_units[index] += 1
    return {
        area["sigla"]: assigned_units[index] / 2
        for index, area in enumerate(areas)
        if assigned_units[index] > 0
    }


def _assign_calendar(
    sessions: list[dict],
    available_days: list[str],
    start_time: time,
    week_start: date,
) -> None:
    day_indexes = sorted(DAY_ORDER.index(day) for day in available_days)
    totals = {day_index: 0.0 for day_index in day_indexes}
    next_start_minutes = {day_index: 0 for day_index in day_indexes}
    for session in sessions:
        day_index = min(day_indexes, key=lambda index: (totals[index], index))
        start_minutes = start_time.hour * 60 + start_time.minute + next_start_minutes[day_index]
        if start_minutes + int(session["horas"] * 60) > 24 * 60:
            raise StudyScheduleTimeError
        session["data"] = week_start + timedelta(days=day_index)
        session["horario_inicio"] = time(start_minutes // 60, start_minutes % 60)
        totals[day_index] += session["horas"]
        next_start_minutes[day_index] += int(session["horas"] * 60) + 30


def _current_week_start() -> date:
    today = datetime.now(ZoneInfo("America/Sao_Paulo")).date()
    return today - timedelta(days=today.weekday())
