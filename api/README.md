# api/

Backend FastAPI.

## Lancer en dev

```bash
cd api
uv sync                     # installe les deps (la première fois)
uv run uvicorn app.main:app --reload --port 8000
```

API : http://localhost:8000 — docs Swagger : http://localhost:8000/docs

## Extraction de PDF

```bash
cd api
uv run python -m scripts.extract_pdf "C:/Users/leopi/Desktop/pdf/lesson 1-1.pdf" --level 1
uv run python -m scripts.extract_pdf "C:/Users/leopi/Desktop/pdf/lesson-4-1.pdf" --level 4
```

Le JSON résultant est écrit dans `data/extracted/` à la racine du repo.

## Structure

```
api/
├── pyproject.toml
├── app/
│   ├── main.py        # FastAPI entrypoint
│   ├── config.py      # Settings Pydantic (lit .env racine)
│   └── llm/
│       └── gemini.py  # wrapper Gemini (extraction + chatbot)
└── scripts/
    └── extract_pdf.py # one-shot extraction d'une leçon PDF
```
