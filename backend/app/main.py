from fastapi import FastAPI
from app.config.settings import settings
from app.routers import auth, users, catalog, tryon, commerce

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API for Virtual Try-On Platform",
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(catalog.router, prefix=settings.API_V1_STR)
app.include_router(tryon.router, prefix=settings.API_V1_STR)
app.include_router(commerce.router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {"status": "ok", "version": settings.VERSION}
