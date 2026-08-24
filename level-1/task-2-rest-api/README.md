# Codveda Level 1 - Task 2: Simple REST API

A RESTful API built with Node.js, Express.js, TypeScript, and PostgreSQL.

## Internship

- Company: Codveda Technologies
- Internship: Full-Stack Development Internship
- Level: Level 1 - Basic
- Task: Build a Simple REST API

## Technologies

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- pg
- dotenv
- CORS
- Postman / Thunder Client

## Features

- Create users
- Get all users
- Get a single user
- Update users
- Delete users
- Request validation
- PostgreSQL database integration
- Parameterized SQL queries
- Proper HTTP status codes
- Error handling
- 404 route handling

## Project Structure

```text
task-2-rest-api/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   └── user.controller.ts
│   ├── middlewares/
│   │   ├── error.middleware.ts
│   │   └── not-found.middleware.ts
│   ├── routes/
│   │   └── user.routes.ts
│   ├── types/
│   │   └── user.ts
│   └── server.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md