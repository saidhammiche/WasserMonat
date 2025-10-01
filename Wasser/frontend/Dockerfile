# Étape 1 : Build du frontend
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2 : Nginx pour servir les fichiers
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 3009
CMD ["nginx", "-g", "daemon off;"]
