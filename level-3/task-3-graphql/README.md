# Codveda Level 3 - Task 3: GraphQL API Development

A GraphQL API built with Apollo Server, Express, TypeScript and PostgreSQL as an alternative to REST for efficient data fetching.

## Features

- Apollo GraphQL Server
- Express.js
- TypeScript
- PostgreSQL
- JWT authentication
- bcrypt password hashing
- User registration
- User login
- GraphQL queries
- GraphQL mutations
- Post CRUD operations
- User/Post relationships
- Protected mutations
- Pagination
- Parameterized SQL queries
- Database query optimization

## Tech Stack

- Node.js
- TypeScript
- Express.js
- Apollo Server
- GraphQL
- PostgreSQL
- pg
- JWT
- bcrypt
- dotenv

## Project Structure

```text
task-3-graphql/
└── backend/
    ├── database/
    │   └── schema.sql
    │
    ├── src/
    │   ├── config/
    │   │   └── database.ts
    │   ├── graphql/
    │   │   ├── resolvers/
    │   │   │   └── index.ts
    │   │   └── typeDefs/
    │   │       └── index.ts
    │   ├── middleware/
    │   │   └── auth.ts
    │   ├── services/
    │   │   ├── post.service.ts
    │   │   └── user.service.ts
    │   └── server.ts
    │
    ├── .env.example
    ├── .gitignore
    ├── package.json
    └── tsconfig.json