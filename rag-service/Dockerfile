FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

# Phase 2 will populate this service with LangChain / ChromaDB logic.
# Skeleton exposes only a /health endpoint.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
