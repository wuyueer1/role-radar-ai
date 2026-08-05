import importlib.util
import json
import subprocess
import sys
import unittest
from pathlib import Path

SCRIPT = Path(__file__).parents[2] / "pipeline" / "embeddings" / "e5.py"
SPEC = importlib.util.spec_from_file_location("role_radar_e5", SCRIPT)
assert SPEC and SPEC.loader
E5 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(E5)


class FakeVectors:
    def __init__(self, values):
        self.values = values

    def tolist(self):
        return self.values


class FakeTokenizer:
    def encode(self, text, add_special_tokens=False):
        del add_special_tokens
        return [ord(character) for character in text]

    def decode(self, token_ids, skip_special_tokens=True):
        del skip_special_tokens
        return "".join(chr(token) for token in token_ids)


class FakeModel:
    def __init__(self):
        self.tokenizer = FakeTokenizer()
        self.seen = []

    def encode(self, texts, **kwargs):
        self.seen.extend(texts)
        assert kwargs["normalize_embeddings"] is True
        values = [[1.0, 0.0] if "research" in text or "product" in text else [0.0, 1.0] for text in texts]
        return FakeVectors(values)


class E5ContractTest(unittest.TestCase):
    def test_valid_payload_has_one_score_per_job_and_required_prefixes(self):
        model = FakeModel()
        payload = {
            "profile": {"evidence": [{"label": "Research", "excerpt": "career research"}]},
            "jobs": [{"id": "job-1", "title": "AI product", "description": "product work", "requirements": []}],
        }
        result = E5.run(payload, model_factory=lambda: model)
        self.assertEqual(result["modelRevision"], "intfloat/multilingual-e5-small@fd1525a9")
        self.assertEqual(len(result["scores"]), 1)
        self.assertTrue(any(text.startswith("query: ") for text in model.seen))
        self.assertTrue(any(text.startswith("passage: ") for text in model.seen))

    def test_invalid_stdin_exits_two_without_stdout(self):
        completed = subprocess.run(
            [sys.executable, str(SCRIPT)],
            input=json.dumps({}),
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(completed.returncode, 2)
        self.assertEqual(completed.stdout, "")
        self.assertIn("invalid input", completed.stderr)


if __name__ == "__main__":
    unittest.main()
