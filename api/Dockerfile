FROM node:20-slim

# Dependências do Chromium (Playwright)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 libxshmfence1 \
    libxfixes3 libx11-xcb1 libxcb1 libxext6 libx11-6 \
    fonts-liberation fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar package.json e instalar dependências
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Instalar apenas Chromium do Playwright
RUN npx playwright install chromium

# Copiar código da API
COPY src/ ./src/

# Porta (Render define via env PORT)
EXPOSE 3001

CMD ["node", "src/server.js"]
