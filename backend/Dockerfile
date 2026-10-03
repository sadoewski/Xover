# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Python + pymorphy3 для морфологического анализа русского языка
# (scripts/morphology_analyzer.py, вызывается из morphologyController.js)
COPY requirements.txt ./
RUN apk add --no-cache python3 py3-pip && \
    python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# Контроллер запускает анализатор через PYTHON_BIN
ENV PYTHON_BIN=/opt/venv/bin/python3

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --only=production

# Копируем исходный код
COPY . .

EXPOSE 5000

CMD ["npm", "start"]
