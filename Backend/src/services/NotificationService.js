const EventEmitter = require('events');

/**
 * NotificationService implements an Observer pattern (EventEmitter) for sending notifications.
 * Other parts of the system can subscribe to events (e.g., leave approved) without tight coupling.
 */
class NotificationService extends EventEmitter {}
const notificationService = new NotificationService();

// Example observer: log when a leave request is approved (in real app, send email or push notification)
notificationService.on('leaveApproved', (leave) => {
  console.log(`Notification: Leave request ${leave._id} approved for user ${leave.user}. (Email sent)`); 
});

// Similarly, could add listeners for swap approved, etc.
// notificationService.on('swapApproved', (swap) => { ... });

module.exports = notificationService;
