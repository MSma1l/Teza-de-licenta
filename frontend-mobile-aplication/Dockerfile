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

# CI=1 dezactiveaza modul interactiv (Expo astepta input pe TTY si iesea singur
# in Docker dupa ~5 min cu exit code 0). Cu CI=1 ramane stabil pe termen lung.
ENV CI=1

# Mod LAN by default. Pentru tunnel ngrok (telefon pe alta retea sau Docker
# Desktop pe Windows care nu expune port-urile pe LAN), seteaza EXPO_DEV_MODE=tunnel.
CMD ["sh", "-c", "if [ \"$EXPO_DEV_MODE\" = \"tunnel\" ]; then echo '>> Mod TUNNEL (ngrok)'; exec npx expo start --tunnel --port 8081; else echo \">> Mod LAN — host: ${REACT_NATIVE_PACKAGER_HOSTNAME:-auto}\"; exec npx expo start --lan --port 8081; fi"]
