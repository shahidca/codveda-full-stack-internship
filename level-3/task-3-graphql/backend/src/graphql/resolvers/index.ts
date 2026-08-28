import {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  loginUser,
} from "../../services/user.service.js";

import {
  getPosts,
  getPostsByAuthorId,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} from "../../services/post.service.js";

/* ======================================================
   GraphQL Context
====================================================== */

type GraphQLContext = {
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
};

/* ======================================================
   Resolvers
====================================================== */

export const resolvers = {
  /* ====================================================
     Queries
  ==================================================== */

  Query: {
    health: () => {
      return "GraphQL API is running";
    },

    /* -----------------------------------------------
       Get all users
    ----------------------------------------------- */

    users: async () => {
      return getUsers();
    },

    /* -----------------------------------------------
       Get single user
    ----------------------------------------------- */

    user: async (
      _parent: unknown,
      args: {
        id: string;
      }
    ) => {
      const userId = Number(args.id);

      if (
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        throw new Error(
          "Invalid user ID"
        );
      }

      return getUserById(userId);
    },

    /* -----------------------------------------------
       Get all posts
    ----------------------------------------------- */

    posts: async (
      _parent: unknown,
      args: {
        limit?: number;
        offset?: number;
      }
    ) => {
      return getPosts(
        args.limit ?? 10,
        args.offset ?? 0
      );
    },
    /* -----------------------------------------------
       Get single post
    ----------------------------------------------- */

    post: async (
      _parent: unknown,
      args: {
        id: string;
      }
    ) => {
      const postId = Number(args.id);

      if (
        !Number.isInteger(postId) ||
        postId <= 0
      ) {
        throw new Error(
          "Invalid post ID"
        );
      }

      return getPostById(postId);
    },
  },

  /* ====================================================
     User Relations
  ==================================================== */

  User: {
    posts: async (
      user: {
        id: number;
      }
    ) => {
      /*
       * Query only this user's posts.
       *
       * This is more efficient than:
       *
       * getPosts()
       * then filter() in JavaScript.
       */

      return getPostsByAuthorId(
        user.id
      );
    },
  },

  /* ====================================================
     Post Relations
  ==================================================== */

  Post: {
    author: async (
      post: {
        authorId: number;
      }
    ) => {
      return getUserById(
        post.authorId
      );
    },
  },

  /* ====================================================
     Mutations
  ==================================================== */

  Mutation: {
    /* ==================================================
       Register
    ================================================== */

    register: async (
      _parent: unknown,
      args: {
        name: string;
        email: string;
        password: string;
      }
    ) => {
      const name =
        args.name.trim();

      const email =
        args.email
          .trim()
          .toLowerCase();

      const password =
        args.password;

      /* -----------------------------------------------
         Validate required fields
      ----------------------------------------------- */

      if (
        !name ||
        !email ||
        !password
      ) {
        return {
          success: false,
          message:
            "All fields are required.",
          user: null,
          accessToken: null,
        };
      }

      /* -----------------------------------------------
         Validate password
      ----------------------------------------------- */

      if (password.length < 6) {
        return {
          success: false,
          message:
            "Password must be at least 6 characters.",
          user: null,
          accessToken: null,
        };
      }

      /* -----------------------------------------------
         Check existing email
      ----------------------------------------------- */

      const existingUser =
        await getUserByEmail(
          email
        );

      if (existingUser) {
        return {
          success: false,
          message:
            "Email is already registered.",
          user: null,
          accessToken: null,
        };
      }

      /* -----------------------------------------------
         Create user
      ----------------------------------------------- */

      const user =
        await createUser(
          name,
          email,
          password
        );

      return {
        success: true,
        message:
          "Registration successful.",
        user,
        accessToken: null,
      };
    },

    /* ==================================================
       Login
    ================================================== */

    login: async (
      _parent: unknown,
      args: {
        email: string;
        password: string;
      }
    ) => {
      const email =
        args.email
          .trim()
          .toLowerCase();

      const password =
        args.password;

      /* -----------------------------------------------
         Validate credentials
      ----------------------------------------------- */

      if (
        !email ||
        !password
      ) {
        return {
          success: false,
          message:
            "Email and password are required.",
          user: null,
          accessToken: null,
        };
      }

      /* -----------------------------------------------
         Login
      ----------------------------------------------- */

      const result =
        await loginUser(
          email,
          password
        );

      if (!result) {
        return {
          success: false,
          message:
            "Invalid email or password.",
          user: null,
          accessToken: null,
        };
      }

      return {
        success: true,
        message:
          "Login successful.",
        user: result.user,
        accessToken:
          result.accessToken,
      };
    },

    /* ==================================================
       Create Post
    ================================================== */

    createPost: async (
      _parent: unknown,
      args: {
        title: string;
        content: string;
      },
      context: GraphQLContext
    ) => {
      /* -----------------------------------------------
         Authentication required
      ----------------------------------------------- */

      if (!context.user) {
        throw new Error(
          "Authentication required"
        );
      }

      /* -----------------------------------------------
         Clean input
      ----------------------------------------------- */

      const title =
        args.title.trim();

      const content =
        args.content.trim();

      /* -----------------------------------------------
         Validate input
      ----------------------------------------------- */

      if (!title) {
        throw new Error(
          "Post title is required"
        );
      }

      if (!content) {
        throw new Error(
          "Post content is required"
        );
      }

      /* -----------------------------------------------
         Authenticated user's ID
      ----------------------------------------------- */

      const authorId =
        context.user.id;

      return createPost(
        title,
        content,
        authorId
      );
    },

    /* ==================================================
       Update Post
    ================================================== */

    updatePost: async (
      _parent: unknown,
      args: {
        id: string;
        title?: string;
        content?: string;
      },
      context: GraphQLContext
    ) => {
      /* -----------------------------------------------
         Authentication required
      ----------------------------------------------- */

      if (!context.user) {
        throw new Error(
          "Authentication required"
        );
      }

      /* -----------------------------------------------
         Validate post ID
      ----------------------------------------------- */

      const postId =
        Number(args.id);

      if (
        !Number.isInteger(postId) ||
        postId <= 0
      ) {
        throw new Error(
          "Invalid post ID"
        );
      }

      /* -----------------------------------------------
         Clean optional fields
      ----------------------------------------------- */

      const title =
        args.title !== undefined
          ? args.title.trim()
          : undefined;

      const content =
        args.content !== undefined
          ? args.content.trim()
          : undefined;

      /* -----------------------------------------------
         Update with ownership check
      ----------------------------------------------- */

      const result =
        await updatePost(
          postId,
          context.user.id,
          title,
          content
        );

      if (!result) {
        throw new Error(
          "Post not found"
        );
      }

      return result;
    },

    /* ==================================================
       Delete Post
    ================================================== */

    deletePost: async (
      _parent: unknown,
      args: {
        id: string;
      },
      context: GraphQLContext
    ) => {
      /* -----------------------------------------------
         Authentication required
      ----------------------------------------------- */

      if (!context.user) {
        throw new Error(
          "Authentication required"
        );
      }

      /* -----------------------------------------------
         Validate post ID
      ----------------------------------------------- */

      const postId =
        Number(args.id);

      if (
        !Number.isInteger(postId) ||
        postId <= 0
      ) {
        throw new Error(
          "Invalid post ID"
        );
      }

      /* -----------------------------------------------
         Delete with ownership check
      ----------------------------------------------- */

      const deleted =
        await deletePost(
          postId,
          context.user.id
        );

      if (!deleted) {
        throw new Error(
          "Post not found or you are not authorized to delete this post"
        );
      }

      return true;
    },
  },
};