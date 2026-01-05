import fs from 'fs';
import dotenv from 'dotenv';
import connectDB from './database/databaseConfig.js';
import http from "http";
import { initSocket } from './socket/index.js';

if (fs.existsSync('.env.development.local')) {
    dotenv.config({ path: '.env.development.local' });
} else {
    dotenv.config();
};

console.log(`Env is loaded in ${process.env.NODE_ENV} mode.`);

const PORT = process.env.PORT || 8383;
const verifyToken = process.env.VERIFY_TOKEN;


const startServer = async () => {

    try {
        await connectDB();


        const { default: app } = await import('./config/express.config.js');

        const server = http.createServer(app);
        initSocket(server); //confirm await will work here or not?

        const { default: jobForRemainder } = await import("./utils/cronJob/job.js");
        await jobForRemainder();

        app.get('/status', (req, res) => {
            res.send('API is running...');

        });

        // Route for GET requests
        app.get('/', (req, res) => {
        const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('WEBHOOK VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.status(403).end();
        }
        });

        // Route for POST requests
        app.post('/', async (req, res) => {
        //default logs
        const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
        console.log(`\n\nWebhook received ${timestamp}\n`);
        console.log(JSON.stringify(req.body, null, 2));

        try {
            // WhatsApp sends status updates and messages to the same webhook
            // We need to differentiate them or handle both
            const body = req.body;

            // Check if this is an event from a page subscription
            if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const statuses = changes?.value?.statuses;

            const {handleIncomingMessage} = await import("./utils/whatsappmessage.js");

            if (value?.messages) {
                await handleIncomingMessage(value.messages[0]); // sending all the messages with context
            }

            for(const status of statuses){
                if(status.status==='failed' && status.errors[0]?.code===131047){
                    console.log('failed due to the whatsapp')
                    
                    const { handleErrorMessage }  = await import('./utils/whatsappmessage.js');
                    await handleErrorMessage(status);
                }

            }

            }

            res.status(200).end();
        } catch (error) {
            if(error.code===11000){
            console.log("dublicate");
            }
            console.error("Error handling webhook:", error);
            res.status(500).end();
        }
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
