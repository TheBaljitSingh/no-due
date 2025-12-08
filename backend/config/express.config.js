import express from "express";
import routes from "../routes/routes.js";
import { corsMiddleware, corsPreflight } from "./corsConfig.js";
import cookieParser from "cookie-parser";
import { sessionMiddleware } from "./sessionConfig.js";
import passport from "../utils/passportSetup/passportSetup.js";

const app = express();
app.set("trust proxy", 1);

//cors configuration in corsConfig.js
app.use(corsMiddleware());

// Preflight handling in corsConfig.js
app.use(corsPreflight);

//body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//session configuration in sessionConfig.js
app.use(sessionMiddleware);

//passport configuration in passportSetup.js
app.use(passport.initialize());
app.use(passport.session());

//routes configuration in routes.js
routes(app);

export default app;