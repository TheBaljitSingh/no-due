import fs from 'fs';
import dotenv from 'dotenv';
import http from "http";
if (fs.existsSync('.env.development.local')) {
    dotenv.config({ path: '.env.development.local' });
} else {
    dotenv.config();
};

import connectDB from './database/databaseConfig.js';
import { initSocket } from './socket/index.js';

import jobForRemainder from "./utils/cronJob/job.js";

const PORT = process.env.PORT || 8383;
const verifyToken = process.env.VERIFY_TOKEN;


const startServer = async () => {
    
    try {
        await connectDB();
        
        const { default: app } = await import('./config/express.config.js');

        const server = http.createServer(app);
        initSocket(server); //confirm await will work here or not?

        await jobForRemainder();

        app.get('/status', (req, res) => {
            res.send('API is running...');

        });


        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
        });

    } catch (error) {
        console.error("Error starting the server:", error);
        process.exit(1);
    }
};

startServer();
