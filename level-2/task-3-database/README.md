# Level 2 - Task 3: Database Integration

## Overview

A PostgreSQL database integration project built with Node.js,
Express.js, TypeScript, and PostgreSQL.

## Technologies

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- pg
- Zod
- REST API

## Features

- PostgreSQL database integration
- Product CRUD operations
- Data validation with Zod
- Database-level constraints
- Database indexes
- Parameterized SQL queries
- Error handling
- RESTful API architecture

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/products` | Create product |
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get product by ID |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

## Validation

Product data is validated using Zod before being stored in PostgreSQL.

Validation includes:

- Product name length
- Description length
- Non-negative price
- Non-negative integer stock
- Required category

## Database Optimization

Indexes were created for:

- `products.name`
- `products.category`

PostgreSQL `EXPLAIN ANALYZE` was used to inspect query execution.

## Security

- Environment variables are used for database credentials.
- `.env` is excluded from Git.
- SQL queries use parameterized values to reduce SQL injection risks.

## Database

Database:

`codveda_auth`

Table:

`products`