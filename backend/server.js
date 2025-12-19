import fs from 'fs';
import dotenv from 'dotenv';
import connectDB from './database/databaseConfig.js';

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

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
        });

        const { default: reminderService } = await import(
            "./services/remainder.service.js"
        );

        setInterval(() => {
            reminderService.processScheduledReminders().catch(console.error);
        }, 5 * 60 * 60 * 1000); // Check every 5 minute

        app.get('/', (req, res) => {
            res.send('API is running...');
        });

    } catch (error) {
        console.error("Error starting the server:", error);
        process.exit(1);
    }
};

startServer();
