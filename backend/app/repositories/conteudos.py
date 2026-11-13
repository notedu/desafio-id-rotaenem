"""Consultas da coleção de conteúdos didáticos no MongoDB."""

import re
from typing import Any

from bson import ObjectId
from pymongo.collection import Collection
from pymongo.errors import PyMongoError


class MongoContentsUnavailableError(RuntimeError):
    """A coleção de conteúdos não pôde ser consultada."""


def find_content_for_topic(
    collection: Collection | None,
    area_sigla: str,
    topic_name: str,
) -> dict | None:
    """Seleciona o conteúdo mais recente que corresponda à área e ao tópico."""
    if collection is None:
        return None
    try:
        document = collection.find_one(
            {
                "area": area_sigla,
                "topico": {"$regex": f"^{re.escape(topic_name)}$", "$options": "i"},
            },
            sort=[("coletado_em", -1), ("titulo", 1)],
        )
    except PyMongoError as error:
        raise MongoContentsUnavailableError from error
    return _normalize_content(document) if document else None


def get_contents_by_ids(collection: Collection | None, content_ids: list[str]) -> dict[str, dict]:
    """Carrega em lote os conteúdos referenciados por um plano salvo."""
    if collection is None or not content_ids:
        return {}
    mongo_ids: list[str | ObjectId] = []
    for content_id in set(content_ids):
        mongo_ids.append(content_id)
        if ObjectId.is_valid(content_id):
            mongo_ids.append(ObjectId(content_id))
    try:
        documents = collection.find({"_id": {"$in": mongo_ids}})
        normalized = [_normalize_content(document) for document in documents]
    except PyMongoError as error:
        raise MongoContentsUnavailableError from error
    return {content["id"]: content for content in normalized}


def _normalize_content(document: dict[str, Any]) -> dict:
    authors = document.get("autores") or document.get("author_name")
    detail = document.get("canal")
    if not detail and authors:
        detail = ", ".join(str(author) for author in authors) if isinstance(authors, list) else str(authors)
    publication_year = document.get("ano_publicacao") or document.get("first_publish_year")
    if publication_year:
        detail = f"{detail} · {publication_year}" if detail else str(publication_year)

    open_library_key = document.get("key")
    url = document.get("url")
    if not url and open_library_key:
        key_path = str(open_library_key)
        if key_path.startswith("http://") or key_path.startswith("https://"):
            url = key_path
        else:
            url = f"https://openlibrary.org/{key_path.lstrip('/')}"

    return {
        "id": str(document.get("_id", "")),
        "tipo": document.get("tipo") or ("livro" if open_library_key else None),
        "titulo": str(document.get("titulo") or document.get("title") or "Conteúdo de estudo"),
        "url": url,
        "fonte": document.get("fonte") or ("openlibrary" if open_library_key else None),
        "detalhe": detail,
    }
