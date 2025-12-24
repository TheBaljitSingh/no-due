import cron from "node-cron";
import reminderService from '../../services/reminder.service.js';


const jobForRemainder=()=>{

    cron.schedule('*/1 * * * *', async () => {
        console.log('running a task every minute');
        try {
            const res = await reminderService.processScheduledReminders();
            console.log('cron job response',res);
        } catch (error) {
            console.log(error);
            
        }

    });
    
}

export default jobForRemainder;