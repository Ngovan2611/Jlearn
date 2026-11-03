# ==============================================================================
# Dockerfile cho AI Tutor Service v2 (FastAPI + ChromaDB + Google GenAI)
# Thiết kế tối ưu đa nền tảng (x86_64 / ARM64) để chạy trên mọi máy tính
# ==============================================================================

FROM python:3.12-slim

# Thiết lập biến môi trường runtime
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    APP_ENV=production \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Cài đặt các gói hệ thống cần thiết (build-essential, curl để healthcheck, chứng chỉ SSL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Tạo user bảo mật không đặc quyền (non-root user)
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/bash -m appuser

# Cài đặt dependencies trước để tận dụng Docker layer cache
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# Sao chép mã nguồn ứng dụng
COPY --chown=appuser:appgroup . .

# Tạo thư mục dữ liệu cho ChromaDB và thư mục tri thức, phân quyền cho appuser
RUN mkdir -p /app/data/chroma /app/knowledge && \
    chown -R appuser:appgroup /app/data /app/knowledge

# Chuyển sang user bảo mật
USER appuser

# Khai báo cổng dịch vụ
EXPOSE 8000

# Kiểm tra sức khỏe container định kỳ
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Lệnh khởi chạy ứng dụng FastAPI qua Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
