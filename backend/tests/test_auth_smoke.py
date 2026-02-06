import unittest
from types import SimpleNamespace
from unittest.mock import patch

from flask import Flask, jsonify, g

from auth import token_auth


class _DummyQuery:
    def __init__(self, agent):
        self._agent = agent

    def filter_by(self, **kwargs):
        return self

    def first(self):
        return self._agent


class TokenAuthSmokeTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config["TESTING"] = True

        @self.app.route("/protected", methods=["GET"])
        @token_auth
        def protected():
            return jsonify({"agent_id": g.agent_id})

        self.client = self.app.test_client()

    def test_allows_authorization_bearer_header(self):
        agent = SimpleNamespace(id="agent-1")
        patched_agent = SimpleNamespace(query=_DummyQuery(agent))

        with patch("auth.Agent", patched_agent):
            resp = self.client.get(
                "/protected",
                headers={"Authorization": "Bearer token-123"},
            )

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.get_json()["agent_id"], "agent-1")

    def test_allows_x_api_token_header(self):
        agent = SimpleNamespace(id="agent-2")
        patched_agent = SimpleNamespace(query=_DummyQuery(agent))

        with patch("auth.Agent", patched_agent):
            resp = self.client.get(
                "/protected",
                headers={"X-API-Token": "token-abc"},
            )

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.get_json()["agent_id"], "agent-2")

    def test_rejects_when_token_missing(self):
        patched_agent = SimpleNamespace(query=_DummyQuery(None))
        with patch("auth.Agent", patched_agent):
            resp = self.client.get("/protected")

        self.assertEqual(resp.status_code, 401)
        self.assertEqual(resp.get_json()["error"], "Missing API token")


if __name__ == "__main__":
    unittest.main()
