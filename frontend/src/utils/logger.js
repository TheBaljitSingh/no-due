
const isDev = import.meta.env.VITE_APP_ENVIRONMENT === "development"; 
const isProd = import.meta.env.VITE_APP_ENVIRONMENT === "production";


const logger = {
  log: (...args) => {
    if (isDev) console.log(...args);
  },

  info: (...args) => {
    if (isDev) console.info(...args);
  },

  warn: (...args) => {
    console.warn(...args); 
  },

  error: (...args) => {
    console.error(...args);

    if (!isProd) return; 

    const first = args[0];

    if (first instanceof Error) {
      Sentry.captureException(first);
    } else {
      Sentry.captureMessage(args.join(" "), { level: "error" });
    }
  },
};

export default logger;