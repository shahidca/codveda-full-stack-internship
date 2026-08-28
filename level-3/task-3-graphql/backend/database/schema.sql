-- =========================================================
-- Codveda Level 3 Task 3
-- GraphQL API Development
-- PostgreSQL Database Schema
-- =========================================================

DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;

-- =========================================================
-- Users
-- =========================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Posts
-- =========================================================

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    content TEXT NOT NULL,

    author_id INTEGER NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT posts_author_id_fkey
        FOREIGN KEY (author_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================
-- Indexes
-- =========================================================

CREATE INDEX idx_users_email
    ON users(email);

CREATE INDEX idx_posts_author_id
    ON posts(author_id);

CREATE INDEX idx_posts_created_at
    ON posts(created_at DESC);