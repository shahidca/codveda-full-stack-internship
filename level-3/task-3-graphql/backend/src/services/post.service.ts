import { pool } from "../config/database.js";

export type Post = {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
};

/* ======================================================
   Get all posts
====================================================== */

export const getPosts = async (
  limit = 10,
  offset = 0
): Promise<Post[]> => {
  const safeLimit = Math.min(
    Math.max(limit, 1),
    100
  );

  const safeOffset = Math.max(
    offset,
    0
  );

  const result = await pool.query<Post>(
    `
      SELECT
        id,
        title,
        content,
        author_id AS "authorId",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM posts
      ORDER BY created_at DESC
      LIMIT $1
      OFFSET $2
    `,
    [safeLimit, safeOffset]
  );

  return result.rows;
};

/* ======================================================
   Get posts by author
   Used for GraphQL relationship resolution.
====================================================== */

export const getPostsByAuthorId = async (
  authorId: number
): Promise<Post[]> => {
  const result = await pool.query<Post>(
    `
      SELECT
        id,
        title,
        content,
        author_id AS "authorId",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM posts
      WHERE author_id = $1
      ORDER BY created_at DESC
    `,
    [authorId]
  );

  return result.rows;
};

/* ======================================================
   Get single post
====================================================== */

export const getPostById = async (
  id: number
): Promise<Post | null> => {
  const result = await pool.query<Post>(
    `
      SELECT
        id,
        title,
        content,
        author_id AS "authorId",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM posts
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] ?? null;
};

/* ======================================================
   Create post
====================================================== */

export const createPost = async (
  title: string,
  content: string,
  authorId: number
): Promise<Post> => {
  const result = await pool.query<Post>(
    `
      INSERT INTO posts (
        title,
        content,
        author_id
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        title,
        content,
        author_id AS "authorId",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [title, content, authorId]
  );

  return result.rows[0];
};

/* ======================================================
   Update post with ownership check
====================================================== */

export const updatePost = async (
  id: number,
  authorId: number,
  title?: string,
  content?: string
): Promise<Post | null> => {
  const existingPost =
    await getPostById(id);

  if (!existingPost) {
    return null;
  }

  /*
   * Ownership check
   *
   * Only the author of the post can update it.
   */
  if (existingPost.authorId !== authorId) {
    throw new Error(
      "You are not authorized to update this post"
    );
  }

  const newTitle =
    title !== undefined
      ? title
      : existingPost.title;

  const newContent =
    content !== undefined
      ? content
      : existingPost.content;

  const result = await pool.query<Post>(
    `
      UPDATE posts
      SET
        title = $1,
        content = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
        AND author_id = $4
      RETURNING
        id,
        title,
        content,
        author_id AS "authorId",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      newTitle,
      newContent,
      id,
      authorId,
    ]
  );

  return result.rows[0] ?? null;
};

/* ======================================================
   Delete post with ownership check
====================================================== */

export const deletePost = async (
  id: number,
  authorId: number
): Promise<boolean> => {
  const result = await pool.query(
    `
      DELETE FROM posts
      WHERE id = $1
        AND author_id = $2
    `,
    [
      id,
      authorId,
    ]
  );

  return result.rowCount === 1;
};