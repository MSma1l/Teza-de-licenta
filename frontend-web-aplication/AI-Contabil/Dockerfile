FROM node:20-alpine

WORKDIR /app

# Instalam dependinte intai (cache layer)
COPY package*.json ./
RUN npm install

# Copiem restul codului
COPY . .

# Vite dev server pe portul 5173
EXPOSE 5173

# --host 0.0.0.0 permite accesul din afara containerului
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
