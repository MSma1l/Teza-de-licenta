FROM node:20-alpine

# Tools necesare pentru pachete native + ngrok tunneling
RUN apk add --no-cache git bash python3 make g++ libc6-compat

WORKDIR /app

# Instalam dependintele intai (cache layer)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Pachet pentru tunelare (necesar pentru --tunnel)
RUN npm install -g @expo/ngrok@4.1.0

# Copiem restul codului
COPY . .

# Expo Metro bundler ruleaza implicit pe portul 8081
EXPOSE 8081
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Mod tunnel: genereaza un URL public, accesibil de pe orice retea
# Telefonul cu Expo Go scaneaza QR-ul si se conecteaza prin tunnel
CMD ["npx", "expo", "start", "--tunnel", "--port", "8081"]
