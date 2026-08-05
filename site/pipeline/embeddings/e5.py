#!/usr/bin/env python3
"""Score candidate evidence against job text with a pinned multilingual E5 model."""

from __future__ import annotations

import json
import math
import sys
from typing import Any, Callable

MODEL_ID = "intfloat/multilingual-e5-small"
MODEL_REVISION = "fd1525a9fd15316a2d503bf26ab031a61d056e98"
MODEL_LABEL = "intfloat/multilingual-e5-small@fd1525a9"


class InputError(ValueError):
    """Raised when stdin does not match the provider contract."""


def validate_payload(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise InputError("input must be an object")
    profile = value.get("profile")
    jobs = value.get("jobs")
    if not isinstance(profile, dict) or not isinstance(profile.get("evidence"), list):
        raise InputError("profile.evidence must be an array")
    if not isinstance(jobs, list):
        raise InputError("jobs must be an array")
    for index, evidence in enumerate(profile["evidence"]):
        if not isinstance(evidence, dict) or not isinstance(evidence.get("excerpt"), str):
            raise InputError(f"profile.evidence[{index}].excerpt must be a string")
    for index, job in enumerate(jobs):
        if not isinstance(job, dict) or not isinstance(job.get("id"), str):
            raise InputError(f"jobs[{index}].id must be a string")
        if not isinstance(job.get("description"), str):
            raise InputError(f"jobs[{index}].description must be a string")
    return value


def load_model() -> Any:
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(MODEL_ID, revision=MODEL_REVISION)


def chunk_text(model: Any, text: str, max_tokens: int = 512) -> list[str]:
    token_ids = model.tokenizer.encode(text, add_special_tokens=False)
    payload_size = max_tokens - 2
    if not token_ids:
        return [""]
    return [
        model.tokenizer.decode(token_ids[start : start + payload_size], skip_special_tokens=True)
        for start in range(0, len(token_ids), payload_size)
    ]


def as_lists(value: Any) -> list[list[float]]:
    raw = value.tolist() if hasattr(value, "tolist") else value
    return [[float(item) for item in row] for row in raw]


def dot(left: list[float], right: list[float]) -> float:
    return sum(a * b for a, b in zip(left, right))


def run(payload: dict[str, Any], model_factory: Callable[[], Any] = load_model) -> dict[str, Any]:
    validated = validate_payload(payload)
    model = model_factory()
    evidence_texts = [
        f"query: {item.get('label', '')} {item['excerpt']}".strip()
        for item in validated["profile"]["evidence"]
    ]
    evidence_vectors = as_lists(
        model.encode(
            evidence_texts,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
    )
    scores: list[dict[str, Any]] = []
    for job in validated["jobs"]:
        job_text = "\n".join(
            [
                str(job.get("title", "")),
                job["description"],
                *[str(item) for item in job.get("requirements", [])],
            ]
        )
        passages = [f"passage: {chunk}" for chunk in chunk_text(model, job_text)]
        passage_vectors = as_lists(
            model.encode(
                passages,
                normalize_embeddings=True,
                convert_to_numpy=True,
                show_progress_bar=False,
            )
        )
        cosine = max(
            (dot(evidence, passage) for evidence in evidence_vectors for passage in passage_vectors),
            default=0.0,
        )
        if not math.isfinite(cosine):
            raise RuntimeError(f"non-finite cosine for {job['id']}")
        scores.append({"jobId": job["id"], "cosine": round(max(-1.0, min(1.0, cosine)), 6)})
    return {"modelRevision": MODEL_LABEL, "scores": scores}


def main() -> int:
    try:
        payload = json.load(sys.stdin)
        result = run(payload)
        sys.stdout.write(json.dumps(result, ensure_ascii=False, separators=(",", ":")))
        return 0
    except (InputError, json.JSONDecodeError) as error:
        sys.stderr.write(f"invalid input: {error}\n")
        return 2
    except Exception as error:  # noqa: BLE001 - CLI boundary must return a stable exit code.
        sys.stderr.write(f"e5 runtime failure: {error}\n")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
