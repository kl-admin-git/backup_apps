FROM node:24

WORKDIR /usr/src/app

# Equivalente en Debian/Ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends \
    mariadb-client \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*
    
COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]

