import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from agent.api.routes import router
from agent.db.connection import db_manager
from agent.db.schema import init_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist
    init_database(db_manager)
    yield


app = FastAPI(
    title="PACT Agent Gateway",
    description="Local Sovereign Executive Agent API with Durable LangGraph State, HITL Approval Gate, and Real-Time SSE",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for Next.js frontend (port 3000) and Vite (port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "service": "PACT Agent Gateway",
        "status": "ONLINE",
        "docs_url": "/docs",
        "health_url": "/api/health",
    }


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("PACT_API_HOST", "0.0.0.0")
    port = int(os.getenv("PACT_API_PORT", "8000"))
    uvicorn.run("agent.api.main:app", host=host, port=port, reload=True)
