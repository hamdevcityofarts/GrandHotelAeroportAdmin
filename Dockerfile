# ---- Stage 1 : Build ----
FROM node:lts-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

ARG VITE_BASE_API_URL
ENV VITE_BASE_API_URL=$VITE_BASE_API_URL

COPY . .
RUN npm run build

# ---- Stage 2 : Serve ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]