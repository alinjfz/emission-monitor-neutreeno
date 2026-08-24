# Shared dependency/source layer for both Vite development and production builds.
FROM node:22-alpine AS frontend-base

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./

FROM frontend-base AS frontend-dev

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM frontend-base AS frontend-build

RUN npm run build

FROM python:3.12-slim AS backend-base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DATABASE_URL=sqlite:////data/emissions.db \
    FRONTEND_DIST=/app/frontend/dist \
    COOKIE_SECURE=false \
    ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000

# The runtime does not need root privileges after dependencies and files are prepared.
RUN addgroup --system app && adduser --system --ingroup app app

WORKDIR /app/backend
COPY backend/requirements.txt ./requirements.txt
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY --chown=app:app backend/ /app/backend/
RUN mkdir -p /data && chown app:app /data

FROM backend-base AS backend-dev

USER app
EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && python -m app.db.seed && fastapi dev app/main.py --host 0.0.0.0 --port 8000"]

FROM backend-base AS runtime

# The final image is single-origin: FastAPI serves both the API and compiled SPA.
COPY --from=frontend-build --chown=app:app /app/frontend/dist /app/frontend/dist

USER app
EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && python -m app.db.seed && fastapi run app/main.py --host 0.0.0.0 --port 8000"]
