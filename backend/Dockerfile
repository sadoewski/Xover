# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Python + pymorphy3 для морфологического анализа русского языка
# (scripts/morphology_analyzer.py, вызывается из morphologyController.js)
COPY requirements.txt ./
RUN apk add --no-cache python3 py3-pip && \
    python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# Контроллер запускает анализатор через PYTHON_BIN
ENV PYTHON_BIN=/opt/venv/bin/python3

# Копируем package files (игнорируем lock если его нет)
COPY package.json ./
COPY package-lock.json* ./

# Устанавливаем зависимости
RUN npm install --omit=dev --legacy-peer-deps

# Копируем миграции и скрипты миграций
COPY migrations ./migrations
COPY migrate.js ./
COPY run-migrations.js ./

# Копируем исходный код
COPY src ./src

# Копируем scripts для морфологии
COPY scripts ./scripts

# Копируем uploads директорию (создаем если нет)
RUN mkdir -p uploads

EXPOSE 5000

CMD ["npm", "start"]
