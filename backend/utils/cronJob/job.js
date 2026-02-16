import cron from "node-cron";
import reminderService from '../../services/reminder.service.js';


const jobForReminder=()=>{

    cron.schedule('*/1 * * * *', async () => {
        console.log('running a task every minute');
        try {
            await reminderService.processScheduledReminders();
        } catch (error) {
            console.log(error);
            
        }

    });
    
}

export default jobForReminder;