import fs from 'fs';
import dotenv from 'dotenv';
import connectDB from './database/databaseConfig.js';
import http from "http";
import { initSocket } from './socket/index.js';
import { initRedisSubscriber } from './redis.js';

if (fs.existsSync('.env.development.local')) {
    dotenv.config({ path: '.env.development.local' });
} else {
    dotenv.config();
};

console.log(`Env is loaded in ${process.env.NODE_ENV} mode.`);

const PORT = process.env.PORT || 8383;

const startServer = async () => {

    try {
        await connectDB();
       

        const { default: app } = await import('./config/express.config.js');

        const server = http.createServer(app);
        const io = await initSocket(server);

        //init redis for that
        await initRedisSubscriber(io);
        
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
        });
        
        const { default: jobForRemainder } = await import("./utils/cronJob/job.js");
        // await jobForRemainder();
        app.get('/', (req, res) => {
            res.send('API is running...');
            
        });

    



    } catch (error) {
        console.error("Error starting the server:", error);
        process.exit(1);
    }
};

startServer();
