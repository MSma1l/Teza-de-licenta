FROM python:3.12-slim

WORKDIR /app

# System dependencies for OpenCV + PaddlePaddle
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create directories
RUN mkdir -p model_storage training_data storage/uploads logs

EXPOSE 3778

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3778", "--workers", "2"]
