"""Casos de uso de metas e simulados."""

import psycopg

from app.repositories import estudos as estudos_repository
from app.schemas.estudos import MetaInput, SimuladoInput


class StudyAreasNotConfiguredError(Exception):
    """As áreas de conhecimento ainda não foram carregadas no PostgreSQL."""


def get_current_goal(connection: psycopg.Connection, student_id: int) -> dict | None:
    return estudos_repository.get_current_goal(connection, student_id)


def save_current_goal(connection: psycopg.Connection, student_id: int, payload: MetaInput) -> dict:
    goal = estudos_repository.save_current_goal(connection, student_id, payload)
    if goal is None:
        raise StudyAreasNotConfiguredError
    return goal


def create_simulation(
    connection: psycopg.Connection,
    student_id: int,
    payload: SimuladoInput,
) -> dict:
    simulation = estudos_repository.create_simulation(connection, student_id, payload)
    if simulation is None:
        raise StudyAreasNotConfiguredError
    return simulation


def list_simulations(connection: psycopg.Connection, student_id: int, limit: int) -> list[dict]:
    return estudos_repository.list_simulations(connection, student_id, limit)
