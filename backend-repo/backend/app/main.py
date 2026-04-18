from __future__ import annotations

from fastapi import FastAPI

from app.routes.auth_routes import router as auth_router
from app.routes.bookings_routes import router as bookings_router
from app.routes.reviews_routes import router as reviews_router
from app.routes.users_routes import router as users_router
from app.routes.workers_routes import router as workers_router
from app.utils.auth_middleware import SupabaseAuthMiddleware


def create_app() -> FastAPI:
    app = FastAPI(title="FixMate AI Backend", version="1.0.0")

    app.add_middleware(
        SupabaseAuthMiddleware,
        public_paths={
            "/",
            "/docs",
            "/openapi.json",
            "/redoc",
            "/signup",
            "/login",
            "/workers",
        },
    )

    @app.get("/")
    async def health():
        return {"status": "ok"}

    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(workers_router)
    app.include_router(bookings_router)
    app.include_router(reviews_router)
    return app


app = create_app()

