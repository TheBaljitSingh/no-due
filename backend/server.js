import fs from 'fs';
import dotenv from 'dotenv';

if (fs.existsSync('.env.development.local')) {
    dotenv.config({ path: '.env.development.local' });
}else if(fs.existsSync('.env')) {
    dotenv.config({ path: '.env' });
}else {
    dotenv.config();
};


// Check if MONGO_URI is loaded
if (!process.env.MONGO_URI) {
    console.error(`[Error] MONGO_URI is not defined! Check your .env file.`);
} else {
    console.log(`[Env] MONGO_URI loaded.`);
}

import http from "http";

// Use dynamic imports for modules that depend on env vars to ensure they run AFTER dotenv
const startServer = async () => {
    try {
        const { default: connectDB } = await import('./database/databaseConfig.js');
        const { default: jobForReminder } = await import('./utils/cronJob/job.js');
        const { initSocket } = await import('./socket/index.js');
        const { corsMiddleware } = await import('./config/corsConfig.js');

        console.log(`[Database] Connecting...`);
        await connectDB();

        const { default: app } = await import('./config/express.config.js');

        const server = http.createServer(app);
        initSocket(server);

        await jobForReminder();

        app.get('/status', (req, res) => {
            res.send('API is running...');
        });

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
        });

    } catch (error) {
        console.error("Error starting the server:", error);
        process.exit(1);
    }
};

startServer();
