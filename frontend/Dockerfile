# Frontend Dockerfile

FROM node:22-alpine AS build

WORKDIR /app

# Устанавливаем зависимости
COPY package.json package-lock.json ./

RUN npm ci

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
