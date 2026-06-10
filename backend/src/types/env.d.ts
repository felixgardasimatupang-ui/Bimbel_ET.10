declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string;
    JWT_ACCESS_SECRET?: string;
    JWT_REFRESH_SECRET?: string;
    CORS_ORIGIN?: string;
    PORT?: string;
    NODE_ENV?: string;
    SENTRY_DSN?: string;
  }
}
