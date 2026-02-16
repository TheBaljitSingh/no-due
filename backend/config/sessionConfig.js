import session from 'express-session';
import MongoStore from 'connect-mongo';

const isProd = process.env.NODE_ENV === 'production';

export const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  ttl: 24 * 60 * 60,
  touchAfter: 24 * 3600,
});

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid',
  proxy: true,
  store: sessionStore,
  cookie: {
    secure: isProd, //user secure in prod
    httpOnly: true, // prevent client side javascript from accessing cookies 
    sameSite: isProd ? 'none' : 'lax', // [ isProd? cookies is send in all request: frontend & backend are ono same domain (localhost) ]
    maxAge: 24 * 60 * 60 * 1000,
  },
});
