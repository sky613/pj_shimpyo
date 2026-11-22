FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV CI=1 \
    EXPO_NO_TELEMETRY=1 \
    CHOKIDAR_USEPOLLING=1 \
    WATCHPACK_POLLING=true

EXPOSE 8081 19000 19001 19002

CMD ["npx", "expo", "start", "--host", "lan"]
