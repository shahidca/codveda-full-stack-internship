import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";

import {
  typeDefs,
} from "./graphql/typeDefs/index.js";

import {
  resolvers,
} from "./graphql/resolvers/index.js";

import {
  getAuthUser,
  AuthUser,
} from "./middleware/auth.js";

dotenv.config();

const PORT =
  Number(process.env.PORT) || 4005;

export type GraphQLContext = {
  user: AuthUser | null;
};

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

const apolloServer =
  new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
  });

await apolloServer.start();

app.use(
  "/graphql",
  expressMiddleware(
    apolloServer,
    {
      context: async ({ req }) => {
        const authorization =
          req.headers.authorization;

        const user =
          await getAuthUser(
            authorization
          );

        return {
          user,
        };
      },
    }
  )
);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message:
      "Codveda Level 3 Task 3 GraphQL API",
    graphql:
      "/graphql",
  });
});

app.listen(PORT, () => {
  console.log(
    `GraphQL server running on http://localhost:${PORT}`
  );

  console.log(
    `GraphQL endpoint: http://localhost:${PORT}/graphql`
  );
});