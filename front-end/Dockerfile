# ==============================================================================
# Dockerfile Đa tầng (Multi-stage) cho Frontend React 19 + Vite
# Chạy độc lập trên mọi hệ điều hành với Nginx siêu nhẹ
# ==============================================================================

# Stage 1: Build source code React
FROM node:20-alpine AS builder
WORKDIR /app

# Tận dụng cache npm
COPY package*.json ./
RUN npm ci || npm install

# Sao chép mã nguồn và tiến hành build production
COPY . .
RUN npm run build

# Stage 2: Web Server Nginx Alpine
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Xóa các file mặc định của Nginx
RUN rm -rf ./*

# Sao chép thư mục dist đã build từ builder stage
COPY --from=builder /app/dist .

# Sao chép cấu hình Nginx hỗ trợ SPA React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
