export const typeDefs = `#graphql

  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
    updatedAt: String!
    posts: [Post!]!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    authorId: ID!
    author: User!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    success: Boolean!
    message: String!
    user: User
    accessToken: String
  }

  type Query {
    health: String!

    users: [User!]!
    user(id: ID!): User

   posts(
  limit: Int = 10
  offset: Int = 0
): [Post!]!
    post(id: ID!): Post
  }

  type Mutation {
    register(
      name: String!
      email: String!
      password: String!
    ): AuthPayload!

    login(
      email: String!
      password: String!
    ): AuthPayload!

    createPost(
      title: String!
      content: String!
    ): Post!

    updatePost(
      id: ID!
      title: String
      content: String
    ): Post!

    deletePost(
      id: ID!
    ): Boolean!
  }
`;