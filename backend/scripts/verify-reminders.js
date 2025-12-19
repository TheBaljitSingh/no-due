
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "../database/databaseConfig.js";

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env.development.local") });

const verify = async () => {
    try {
        console.log("Connecting to DB...");
        // Use the imported connectDB which sets up the connection object
        await connectDB();
        console.log("Connected.");

        // Dynamic imports to ensure connection is ready
        // These modules presumably use the 'connection' exported from databaseConfig.js
        // Since connectDB() has run, 'connection' should be populated.
        const { default: Transaction } = await import("../model/transaction.model.js");
        const { default: Customer } = await import("../model/customer.model.js");
        const { default: Reminder } = await import("../model/remainder.model.js");
        const { default: remainderService } = await import("../services/remainder.service.js");

        // 1. Create Dummy Customer & Transaction
        console.log("Creating dummy data...");
        const customer = await Customer.create({
            name: "Test User",
            mobile: "919876543210",
            email: "test@example.com",
            address: "Test Address"
        });

        const transaction = await Transaction.create({
            customerId: customer._id,
            type: "DUE_ADDED",
            amount: 100,
            previousDue: 0,
            newDue: 100,
            dueDate: new Date(Date.now() + 86400000), // tomorrow
            metadata: { note: "Test Due" }
        });

        console.log("Dummy Transaction ID:", transaction._id);

        // 2. Test Send Now
        console.log("Testing Send Now...");
        try {
            const resNow = await remainderService.sendNow({
                transactionId: transaction._id,
                templateName: "hello_world",
                variables: ["Test User", "100", "Tomorrow"]
            });
            console.log("Send Now Result:", resNow.success ? "SUCCESS" : "FAILED", resNow.providerResponse);
        } catch (e) {
            console.error("Send Now Failed (Expected if no valid token/whatsapp setup):", e.message);
        }

        // 3. Test Schedule
        console.log("Testing Schedule...");
        const scheduledFor = new Date(Date.now() + 2000); // 2 seconds from now
        const resSchedule = await remainderService.schedule({
            transactionId: transaction._id,
            scheduledFor,
            templateName: "hello_world",
            variables: ["Test User", "100", "Tomorrow"]
        });
        console.log("Schedule Result:", resSchedule.status === "PENDING" ? "SUCCESS" : "FAILED");

        // 4. Test Process Scheduled (Wait 3s then run)
        console.log("Waiting for 3s to let schedule match...");
        await new Promise(r => setTimeout(r, 3000));

        console.log("Processing Scheduled Reminders...");
        await remainderService.processScheduledReminders();

        // Verify status
        const updatedReminder = await Reminder.findById(resSchedule._id);
        console.log("Updated Reminder Status:", updatedReminder.status);
        if (updatedReminder.status === "SENT") {
            console.log("Verification of Scheduler: SUCCESS");
        } else {
            console.log("Verification of Scheduler: FAILED (Status: " + updatedReminder.status + ")");
            if (updatedReminder.status === "FAILED") console.log("Error:", updatedReminder.lastError);
        }


        // Cleanup
        console.log("Cleaning up...");
        await Transaction.findByIdAndDelete(transaction._id);
        await Customer.findByIdAndDelete(customer._id);
        await Reminder.deleteMany({ transactionId: transaction._id });

        console.log("Done.");
        process.exit(0);

    } catch (error) {
        console.error("Verification Failed:", error);
        process.exit(1);
    }
};

verify();
