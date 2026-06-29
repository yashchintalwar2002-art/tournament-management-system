# Tournament Pro - Run Guide

This project has a Spring Boot backend and a React frontend.

## Local Requirements

- Java 21
- Node.js 18 or newer
- MySQL running locally
- Database: `tournament_db`

## Backend

From `tournament-app`:

```powershell
.\mvnw.cmd spring-boot:run
```

Default backend URL:

```text
http://localhost:8080
```

Useful environment variables:

```text
DB_URL=jdbc:mysql://localhost:3306/tournament_db
DB_USERNAME=root
DB_PASSWORD=root123
JWT_SECRET=change-this-for-production
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google
JPA_DDL_AUTO=update
JPA_SHOW_SQL=false
SERVER_PORT=8080
```

## Frontend

From `tournament-app\tournament-frontend`:

```powershell
npm start
```

Default frontend URL:

```text
http://localhost:3000
```

Production build:

```powershell
npm run build
```

Frontend environment:

```text
REACT_APP_API_URL=http://localhost:8080
```

## Verified Commands

These commands were verified successfully:

```powershell
npm run build
.\mvnw.cmd test
```

## Production Notes

- Do not commit real Google OAuth secrets or production JWT secrets.
- Set `JWT_SECRET` to a long random value in production.
- Set `JPA_DDL_AUTO=validate` or manage schema changes through migrations for production.
- Configure `REACT_APP_API_URL` to the deployed backend URL before building the frontend.
