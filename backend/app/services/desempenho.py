"""Cálculos de desempenho e prioridade a partir dos dados integrados."""

import logging

import psycopg

from app.repositories import estudos as estudos_repository
from app.repositories.referencias import get_latest_enem_reference
from app.schemas.desempenho import PerformanceOutput
from app.db.duckdb import DuckDBUnavailableError

logger = logging.getLogger(__name__)


def get_student_performance(connection: psycopg.Connection, student: dict) -> dict:
    student_id = student["id"]
    goal = estudos_repository.get_current_goal(connection, student_id)
    simulation = estudos_repository.get_latest_simulation(connection, student_id)
    knowledge_areas = estudos_repository.get_knowledge_areas(connection)

    reference_error: str | None = None
    try:
        reference = get_latest_enem_reference(student.get("uf"))
    except DuckDBUnavailableError:
        logger.exception("Não foi possível carregar a referência do DuckDB.")
        reference = None
        reference_error = "Dados de referência do ENEM indisponíveis no DuckDB."

    goal_areas = {area["sigla"]: area for area in goal["areas"]} if goal else {}
    current_scores = simulation["notas"] if simulation else {}
    reference_scores = reference["medias"] if reference else {}

    areas: list[dict] = []
    ranking: list[dict] = []
    for area in knowledge_areas:
        sigla = area["sigla"]
        goal_area = goal_areas.get(sigla)
        current_score = current_scores.get(sigla)
        target_score = goal_area["nota_alvo"] if goal_area else None
        weight = goal_area["peso"] if goal_area else None
        reference_score = reference_scores.get(sigla)
        distance = float(target_score) - float(current_score) if target_score is not None and current_score is not None else None
        needed_gain = max(distance, 0.0) if distance is not None else None
        priority = round(needed_gain * float(weight), 2) if needed_gain is not None and weight is not None else None
        reference_difference = float(current_score) - float(reference_score) if current_score is not None and reference_score is not None else None

        area_result = {
            "sigla": sigla,
            "nome": area["nome"],
            "nota_atual": float(current_score) if current_score is not None else None,
            "nota_alvo": float(target_score) if target_score is not None else None,
            "peso": float(weight) if weight is not None else None,
            "media_referencia": float(reference_score) if reference_score is not None else None,
            "diferenca_referencia": round(reference_difference, 2) if reference_difference is not None else None,
            "diferenca_meta": round(distance, 2) if distance is not None else None,
            "ganho_necessario": round(needed_gain, 2) if needed_gain is not None else None,
            "prioridade": priority,
        }
        areas.append(area_result)

        if priority is not None and current_score is not None and target_score is not None and weight is not None:
            ranking.append({
                "sigla": sigla,
                "nome": area["nome"],
                "prioridade": priority,
                "nota_atual": float(current_score),
                "nota_alvo": float(target_score),
                "peso": float(weight),
                "ganho_necessario": round(needed_gain, 2),
            })

    order = {area["sigla"]: index for index, area in enumerate(knowledge_areas)}
    ranking.sort(key=lambda item: (-item["prioridade"], order[item["sigla"]]))

    reference_summary = {
        "disponivel": reference is not None,
        "ano": reference["ano"] if reference else None,
        "uf": reference["uf"] if reference else None,
        "abrangencia": reference["abrangencia"] if reference else None,
        "participantes": reference["participantes"] if reference else None,
        "mensagem": reference_error or (None if reference else "Ainda não há dados de referência do ENEM carregados."),
    }

    simulation_summary = None
    if simulation is not None:
        scores = [float(score) for score in simulation["notas"].values()]
        simulation_summary = {
            "id": simulation["id"],
            "realizado_em": simulation["realizado_em"],
            "descricao": simulation["descricao"],
            "criado_em": simulation["criado_em"],
            "nota_media": round(sum(scores) / len(scores), 2) if scores else None,
        }

    return PerformanceOutput(
        meta=goal,
        simulado_atual=simulation_summary,
        referencia=reference_summary,
        areas=areas,
        ranking_prioridades=ranking,
    ).model_dump()
