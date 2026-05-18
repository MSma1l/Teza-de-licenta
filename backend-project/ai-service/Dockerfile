FROM python:3.12-slim-bookworm

WORKDIR /app

# System dependencies for OpenCV + PaddlePaddle.
# Pinned pe bookworm pentru ca trixie a redenumit libgl1-mesa-glx -> libgl1.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --retries 5 --timeout 180 --upgrade pip \
 && pip install --no-cache-dir --retries 5 --timeout 180 -r requirements.txt

# Copy application
COPY . .

# Create directories
RUN mkdir -p model_storage training_data storage/uploads logs

EXPOSE 3778

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3778", "--workers", "2"]
