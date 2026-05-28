"""Shared utilities for Resonance backend."""
from typing import Any


def serialize_doc(doc: dict[str, Any]) -> dict[str, Any]:
    """Convert MongoDB _id to string id field. Returns a new dict."""
    if doc is None:
        return doc
    d = dict(doc)
    if "_id" in d:
        d["id"] = str(d.pop("_id"))
    return d


def serialize_docs(docs: list[dict]) -> list[dict]:
    """Serialize a list of MongoDB documents."""
    return [serialize_doc(d) for d in docs]
