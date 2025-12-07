
const isDev = import.meta.env.ENVIRONMENT === "development"; 

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
  },
};

export default logger;
