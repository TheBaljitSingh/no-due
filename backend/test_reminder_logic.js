
import { getReminderType } from './controller/remainder.controller.js';

// Logic extracted from backend/services/reminder.service.js (scheduleByUser)
// The service logic uses this snippet:
/*
    const dueDate = new Date(transaction.dueDate);
    const scheduleDate = new Date(scheduledFor);

    dueDate.setHours(0, 0, 0, 0);
    scheduleDate.setHours(0, 0, 0, 0);

    let reminderType;
    let templateName;

    if (scheduleDate > dueDate) {
      reminderType = "after_due";
      // ...
    } else if (scheduleDate.getTime() === dueDate.getTime()) {
      reminderType = "due_today";
      // ...
    } else {
      reminderType = "before_due";
      // ...
    }
*/
function serviceLogic(dueDateInput, scheduledForInput) {
    const dueDate = new Date(dueDateInput);
    const scheduleDate = new Date(scheduledForInput);

    dueDate.setHours(0, 0, 0, 0);
    scheduleDate.setHours(0, 0, 0, 0);

    let reminderType;

    if (scheduleDate > dueDate) {
        reminderType = "after_due";
    } else if (scheduleDate.getTime() === dueDate.getTime()) {
        reminderType = "due_today";
    } else {
        reminderType = "before_due";
    }
    return reminderType;
}

// Controller Logic from backend/controller/remainder.controller.js
// function getReminderType(dueDate, now) { ... }
// Uses: 'due_before', 'due_today', 'overdue'

console.log("=== Testing Reminder Logic ===\n");

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

console.log(`Today is: ${today.toISOString().split('T')[0]}`);
console.log(`Yesterday was: ${yesterday.toISOString().split('T')[0]}`);
console.log(`Tomorrow will be: ${tomorrow.toISOString().split('T')[0]}\n`);


console.log("--- Controller Logic (getReminderType) ---");
// Controller compares (dueDate, now)
// Case 1: Due Date is Today (Should be 'due_today')
const typeToday = getReminderType(today, today);
console.log(`Due Date matches Today: ${typeToday} (Expected: due_today)`);

// Case 2: Due Date was Yesterday (So today is AFTER due date -> Overdue)
// "now" is effectively "scheduledFor" in this context of "sending now"
const typeOverdue = getReminderType(yesterday, today);
console.log(`Due Date was Yesterday: ${typeOverdue} (Expected: overdue)`);

// Case 3: Due Date is Tomorrow (So today is BEFORE due date -> Before Due)
const typeBefore = getReminderType(tomorrow, today);
console.log(`Due Date is Tomorrow : ${typeBefore} (Expected: due_before)`);
console.log("\n");


console.log("--- Service Logic (scheduleByUser Mimic) ---");
// Service compares (transaction.dueDate, scheduledFor)
// Case 1: Scheduled for Today, Due Today
const serviceToday = serviceLogic(today, today);
console.log(`Due Today, Scheduled Today: ${serviceToday} (Expected: due_today)`);

// Case 2: Scheduled for Today, Due Yesterday (Overdue)
// If I schedule for today a transaction that was due yesterday
const serviceOverdue = serviceLogic(yesterday, today);
console.log(`Due Yesterday, Scheduled Today: ${serviceOverdue} (Expected: after_due)`);

// Case 3: Scheduled for Today, Due Tomorrow (Before Due)
const serviceBefore = serviceLogic(tomorrow, today);
console.log(`Due Tomorrow, Scheduled Today: ${serviceBefore} (Expected: before_due)`);

console.log("\n=== Test Logic Complete ===");
