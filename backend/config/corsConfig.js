import cors from "cors";

export const corsMiddleware = () => {
  const allowedOrigins = (process.env.CLIENT_BASE_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, mobile apps, server calls)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true, // Important for cookies / auth

    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],
  });
};
