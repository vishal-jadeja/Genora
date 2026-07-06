from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import require_internal_secret
from app.main import app as real_app

real_client = TestClient(real_app)


def test_health_stays_ungated():
    response = real_client.get("/health")
    assert response.status_code == 200


def _build_gated_test_app() -> FastAPI:
    test_app = FastAPI()

    @test_app.get("/protected", dependencies=[Depends(require_internal_secret)])
    def protected() -> dict[str, bool]:
        return {"ok": True}

    return test_app


gated_client = TestClient(_build_gated_test_app())


def test_gated_route_rejects_missing_secret():
    response = gated_client.get("/protected")
    assert response.status_code == 401


def test_gated_route_rejects_wrong_secret():
    response = gated_client.get("/protected", headers={"x-internal-secret": "wrong-secret"})
    assert response.status_code == 401


def test_gated_route_accepts_correct_secret():
    response = gated_client.get(
        "/protected",
        headers={"x-internal-secret": settings.internal_service_secret},
    )
    assert response.status_code == 200
    assert response.json() == {"ok": True}
