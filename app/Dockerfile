# ---- Stage 1: build the static app ----
FROM node:20-alpine AS build
WORKDIR /app

# TMDB key is a public (client-side) API key by design, but still passed as
# a build arg rather than hardcoded so it's not baked into the Dockerfile
# itself. Vite inlines any VITE_-prefixed env var into the JS bundle at
# build time — pass it with:
#   docker build --build-arg VITE_TMDB_API_KEY=xxxx -t streamflix-clone .
ARG VITE_TMDB_API_KEY
ENV VITE_TMDB_API_KEY=$VITE_TMDB_API_KEY

COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---- Stage 2: serve with nginx ----
FROM nginx:1.27-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD wget -q -O- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
