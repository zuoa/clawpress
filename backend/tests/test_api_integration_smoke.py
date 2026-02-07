import unittest
import uuid
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import patch

from app import create_app


class _Field:
    def desc(self):
        return self


class _Pagination:
    def __init__(self, items, page, per_page):
        self.total = len(items)
        self.page = page
        self.per_page = per_page
        self.pages = (self.total + per_page - 1) // per_page if per_page else 1
        start = (page - 1) * per_page
        end = start + per_page
        self.items = items[start:end]


class _VoteCollection:
    def __init__(self, store, post_id):
        self._store = store
        self._post_id = post_id

    def filter_by(self, **kwargs):
        value = kwargs.get("value")
        items = [v for v in self._store.votes if v.post_id == self._post_id]
        if value is not None:
            items = [v for v in items if v.value == value]
        return _SimpleCollection(items)


class _SimpleCollection:
    def __init__(self, items):
        self._items = items

    def count(self):
        return len(self._items)


class _Store:
    def __init__(self):
        self.agents = []
        self.posts = []
        self.comments = []
        self.votes = []


class FakeAgent:
    def __init__(self, id=None, username="", name="", description="", avatar_url=None, bio=None, theme="default", token="", is_active=True):
        self.id = id or str(uuid.uuid4())
        self.username = username
        self.name = name
        self.description = description
        self.avatar_url = avatar_url
        self.bio = bio
        self.theme = theme
        self.token = token
        self.is_active = is_active
        self.heartbeat_at = None
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def to_dict(self, include_sensitive=False):
        data = {
            "id": self.id,
            "username": self.username,
            "name": self.name,
            "description": self.description,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "theme": self.theme,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if include_sensitive:
            data["token"] = self.token
            data["heartbeat_at"] = self.heartbeat_at.isoformat() if self.heartbeat_at else None
        return data

    def to_site_dict(self):
        return {
            "username": self.username,
            "name": self.name,
            "description": self.description,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "theme": self.theme,
            "posts_count": len([p for p in self._store.posts if p.agent_id == self.id]),
            "created_at": self.created_at.isoformat(),
        }


class FakePost:
    created_at = _Field()

    def __init__(self, agent_id, title, slug, content, tags=None):
        self.id = str(uuid.uuid4())
        self.agent_id = agent_id
        self.title = title
        self.slug = slug
        self.content = content
        self.tags = tags or []
        self.view_count = 0
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self._store = None

    @property
    def author(self):
        for agent in self._store.agents:
            if agent.id == self.agent_id:
                return agent
        return None

    @property
    def votes(self):
        return _VoteCollection(self._store, self.id)

    def to_dict(self):
        return {
            "id": self.id,
            "agent_id": self.agent_id,
            "agent_username": self.author.username if self.author else None,
            "title": self.title,
            "slug": self.slug,
            "content": self.content,
            "tags": self.tags or [],
            "view_count": self.view_count,
            "comments_count": len([c for c in self._store.comments if c.post_id == self.id]),
            "upvotes": self.votes.filter_by(value=1).count(),
            "downvotes": self.votes.filter_by(value=-1).count(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def to_site_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "excerpt": self.content[:200] + "..." if len(self.content) > 200 else self.content,
            "tags": self.tags or [],
            "view_count": self.view_count,
            "comments_count": len([c for c in self._store.comments if c.post_id == self.id]),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class FakeComment:
    created_at = _Field()

    def __init__(self, post_id, agent_id, content):
        self.id = str(uuid.uuid4())
        self.post_id = post_id
        self.agent_id = agent_id
        self.content = content
        self.created_at = datetime.utcnow()
        self._store = None

    @property
    def author(self):
        for agent in self._store.agents:
            if agent.id == self.agent_id:
                return agent
        return None

    def to_dict(self):
        return {
            "id": self.id,
            "post_id": self.post_id,
            "agent_id": self.agent_id,
            "agent_username": self.author.username if self.author else None,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
        }


class FakeVote:
    def __init__(self, post_id, agent_id, value):
        self.id = str(uuid.uuid4())
        self.post_id = post_id
        self.agent_id = agent_id
        self.value = value
        self.created_at = datetime.utcnow()


class _Query:
    def __init__(self, items):
        self._items = items

    def filter_by(self, **kwargs):
        result = []
        for item in self._items:
            ok = True
            for key, value in kwargs.items():
                if getattr(item, key, None) != value:
                    ok = False
                    break
            if ok:
                result.append(item)
        return _Query(result)

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self._items[0] if self._items else None

    def all(self):
        return list(self._items)

    def order_by(self, *args, **kwargs):
        return self

    def paginate(self, page=1, per_page=20, error_out=False):
        return _Pagination(self._items, page, per_page)

    def get(self, item_id):
        for item in self._items:
            if getattr(item, "id", None) == item_id:
                return item
        return None


class _QueryManager:
    def __init__(self, store, field):
        self._store = store
        self._field = field

    def _query(self):
        return _Query(getattr(self._store, self._field))

    def filter_by(self, **kwargs):
        return self._query().filter_by(**kwargs)

    def filter(self, *args, **kwargs):
        return self._query().filter(*args, **kwargs)

    def first(self):
        return self._query().first()

    def all(self):
        return self._query().all()

    def order_by(self, *args, **kwargs):
        return self._query().order_by(*args, **kwargs)

    def paginate(self, *args, **kwargs):
        return self._query().paginate(*args, **kwargs)

    def get(self, item_id):
        return self._query().get(item_id)


class _FakeSession:
    def __init__(self, store):
        self._store = store

    def add(self, obj):
        if isinstance(obj, FakeAgent):
            obj._store = self._store
            self._store.agents.append(obj)
        elif isinstance(obj, FakePost):
            obj._store = self._store
            self._store.posts.append(obj)
        elif isinstance(obj, FakeComment):
            obj._store = self._store
            self._store.comments.append(obj)
        elif isinstance(obj, FakeVote):
            self._store.votes.append(obj)

    def delete(self, obj):
        if isinstance(obj, FakeVote):
            self._store.votes = [v for v in self._store.votes if v.id != obj.id]
        elif isinstance(obj, FakePost):
            self._store.posts = [p for p in self._store.posts if p.id != obj.id]
            self._store.comments = [c for c in self._store.comments if c.post_id != obj.id]
            self._store.votes = [v for v in self._store.votes if v.post_id != obj.id]

    def commit(self):
        return None


class ApiIntegrationSmokeTests(unittest.TestCase):
    def setUp(self):
        self.store = _Store()
        self.app = create_app("development")
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

        self.db_stub = SimpleNamespace(session=_FakeSession(self.store))

        FakeAgent.query = _QueryManager(self.store, "agents")
        FakePost.query = _QueryManager(self.store, "posts")
        FakeComment.query = _QueryManager(self.store, "comments")
        FakeVote.query = _QueryManager(self.store, "votes")

        self.patches = [
            patch("api.agents.Agent", FakeAgent),
            patch("api.posts.Agent", FakeAgent),
            patch("api.comments.Agent", FakeAgent),
            patch("api.votes.Agent", FakeAgent),
            patch("api.sites.Agent", FakeAgent),
            patch("auth.Agent", FakeAgent),
            patch("api.posts.Post", FakePost),
            patch("api.comments.Post", FakePost),
            patch("api.sites.Post", FakePost),
            patch("api.votes.Post", FakePost),
            patch("api.comments.Comment", FakeComment),
            patch("api.votes.Vote", FakeVote),
            patch("api.agents.db", self.db_stub),
            patch("api.posts.db", self.db_stub),
            patch("api.comments.db", self.db_stub),
            patch("api.votes.db", self.db_stub),
            patch("api.sites.db", self.db_stub),
        ]
        for p in self.patches:
            p.start()

    def tearDown(self):
        for p in reversed(self.patches):
            p.stop()

    def test_register_create_post_comment_vote_and_fetch_site(self):
        register_resp = self.client.post(
            "/api/v1/agents/register",
            json={
                "username": "agent1",
                "name": "Agent One",
                "description": "test",
            },
        )
        self.assertEqual(register_resp.status_code, 201)
        token = register_resp.get_json()["agent"]["token"]

        me_resp = self.client.get(
            "/api/v1/agents/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.get_json()["agent"]["username"], "agent1")

        post_resp = self.client.post(
            "/api/v1/posts",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "Hello Post", "content": "body", "tags": ["t1"]},
        )
        self.assertEqual(post_resp.status_code, 201)
        post_id = post_resp.get_json()["post"]["id"]
        slug = post_resp.get_json()["post"]["slug"]

        list_resp = self.client.get("/api/v1/posts")
        self.assertEqual(list_resp.status_code, 200)
        self.assertEqual(list_resp.get_json()["total"], 1)

        comment_resp = self.client.post(
            f"/api/v1/posts/{post_id}/comments",
            headers={"Authorization": f"Bearer {token}"},
            json={"content": "Nice post"},
        )
        self.assertEqual(comment_resp.status_code, 201)

        vote_resp = self.client.post(
            f"/api/v1/posts/{post_id}/upvote",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(vote_resp.status_code, 200)
        self.assertEqual(vote_resp.get_json()["upvotes"], 1)

        site_resp = self.client.get("/api/v1/sites/agent1")
        self.assertEqual(site_resp.status_code, 200)
        self.assertEqual(site_resp.get_json()["site"]["username"], "agent1")

        site_post_resp = self.client.get(f"/api/v1/sites/agent1/posts/{slug}")
        self.assertEqual(site_post_resp.status_code, 200)
        self.assertEqual(site_post_resp.get_json()["post"]["id"], post_id)

    def test_slug_generation_for_non_ascii_and_symbols_only_titles(self):
        register_resp = self.client.post(
            "/api/v1/agents/register",
            json={"username": "slugagent", "name": "Slug Agent"},
        )
        self.assertEqual(register_resp.status_code, 201)
        token = register_resp.get_json()["agent"]["token"]

        cjk_title_resp = self.client.post(
            "/api/v1/posts",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "你好世界 测试", "content": "body"},
        )
        self.assertEqual(cjk_title_resp.status_code, 201)
        cjk_slug = cjk_title_resp.get_json()["post"]["slug"]
        self.assertTrue(cjk_slug)
        self.assertRegex(cjk_slug, r"^[a-z0-9-]+$")
        self.assertNotEqual(cjk_slug[:5], "post-")

        symbol_only_title_resp = self.client.post(
            "/api/v1/posts",
            headers={"Authorization": f"Bearer {token}"},
            json={"title": "🚀!!!@@@", "content": "body"},
        )
        self.assertEqual(symbol_only_title_resp.status_code, 201)
        symbol_slug = symbol_only_title_resp.get_json()["post"]["slug"]
        self.assertTrue(symbol_slug)
        self.assertRegex(symbol_slug, r"^post-[a-f0-9]{8}$")

    def test_get_recent_voters_returns_usernames(self):
        reg_a = self.client.post(
            "/api/v1/agents/register",
            json={"username": "author1", "name": "Author One"},
        )
        self.assertEqual(reg_a.status_code, 201)
        token_a = reg_a.get_json()["agent"]["token"]

        reg_b = self.client.post(
            "/api/v1/agents/register",
            json={"username": "voterup", "name": "Voter Up"},
        )
        self.assertEqual(reg_b.status_code, 201)
        token_b = reg_b.get_json()["agent"]["token"]

        reg_c = self.client.post(
            "/api/v1/agents/register",
            json={"username": "voterdown", "name": "Voter Down"},
        )
        self.assertEqual(reg_c.status_code, 201)
        token_c = reg_c.get_json()["agent"]["token"]

        post_resp = self.client.post(
            "/api/v1/posts",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"title": "Vote Target", "content": "body"},
        )
        self.assertEqual(post_resp.status_code, 201)
        post_id = post_resp.get_json()["post"]["id"]

        upvote_resp = self.client.post(
            f"/api/v1/posts/{post_id}/upvote",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        self.assertEqual(upvote_resp.status_code, 200)

        downvote_resp = self.client.post(
            f"/api/v1/posts/{post_id}/downvote",
            headers={"Authorization": f"Bearer {token_c}"},
        )
        self.assertEqual(downvote_resp.status_code, 200)

        voters_resp = self.client.get(f"/api/v1/posts/{post_id}/voters?limit=5")
        self.assertEqual(voters_resp.status_code, 200)
        voters_data = voters_resp.get_json()
        self.assertIn("voterup", voters_data["upvoters"])
        self.assertIn("voterdown", voters_data["downvoters"])


if __name__ == "__main__":
    unittest.main()
