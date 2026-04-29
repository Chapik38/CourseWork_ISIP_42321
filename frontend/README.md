

### запуск
## Docker
```bash
docker run -d --name compcraft -p 8080:80 -v compcraft_mysql:/var/lib/mysql chapik38/compcraft:latest
```
### Откройте сайт 
http://localhost:8080

### Сборка Docker Образа из исходников

Соберите frontend
```bash
cd frontend
npm install
npm run build
cd ..
```
Соберите Docker-образ
```bash
docker build -t compcraft:local .
```
### Запустите собранный образ
```bash
docker run -d --name compcraft -p 8080:80 -v compcraft_mysql:/var/lib/mysql compcraft:local
```
### Откройте сайт 
http://localhost:8080

## Node js

```text
Перейлите в папку backand 
создай .env из примера .env.example
установите Зависимости 
Запустите Seed
Запустите backand
```

```bash
cd backend
npm install
npm run seed
npm start
```

API: `http://localhost:5000/api/v1`.

Создадутся пользователи:

```text
admin@example.com / Admin12345
demo@example.com / User12345
```

## Frontend

```text
Перейлите в папку frontend
установите Зависимости
Запустите frontend
```

```bash
cd frontend
npm install
npm run dev
```

SPA: `http://localhost:5173`.
