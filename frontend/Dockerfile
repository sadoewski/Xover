# Frontend Dockerfile

FROM node:20-alpine AS build

WORKDIR /app

# Копируем package files (игнорируем lock если его нет)
COPY package.json ./
COPY package-lock.json* ./

# Устанавливаем зависимости (используем install вместо ci если lock поврежден)
RUN npm install --legacy-peer-deps

# Копируем исходный код
COPY . .

# Собираем production-версию
RUN npm run build


# Production stage
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=build /app/dist /usr/share/nginx/html

# Конфигурация nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
