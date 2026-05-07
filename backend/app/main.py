from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.core.config import settings
from app.modules.notes.router import router as notes_router
from app.modules.tasks.router import router as tasks_router


app = FastAPI(
    title="COlendar API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(notes_router)
app.include_router(tasks_router)
