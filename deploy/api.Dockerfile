# Image FastAPI basée sur uv (rapide + image légère)

FROM python:3.12-slim AS base
RUN pip install --no-cache-dir uv==0.9.9
WORKDIR /app

# Install deps en premier pour bénéficier du cache Docker
COPY api/pyproject.toml api/uv.lock* ./api/
WORKDIR /app/api
RUN uv sync --frozen --no-dev

# Copie le code
COPY api/app ./app
COPY api/scripts ./scripts

ENV PATH="/app/api/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
