    import cors from 'cors';

export const corsMiddleware = () => {
const allowedOrigins = (process.env.CLIENT_BASE_URL || '')
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);

console.log("Allowed Origins:", allowedOrigins);

  return cors({
    origin(origin, callback) {
      console.log('Request origin:', origin);

      if (
        !origin ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        console.log('CORS Error - Origin not allowed:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
  });
};

// Preflight handler separated as well
export const corsPreflight = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.sendStatus(200);
  }
  next();
};
