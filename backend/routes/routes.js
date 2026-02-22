import customerRoutes from './customer.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import reminderRoutes from "./reminder.routes.js"
import paymentTermRoutes from './paymentTerm.routes.js';
import whatsappRoutes from "./whatsapp.routes.js"
import whatsappWebhookRoutes from "./whatsappWebhookRoutes.routes.js"
import notificationRoutes from "./notification.routes.js"

const routes = (app) => {
  app.use('/api/v1/customers', customerRoutes);
  app.use('/api/v1/auth', authRoutes);
  // Support for specific Facebook callback URL requested by user
  // app.use('/api/auth', authRoutes);
  app.use('/api/v1/user', userRoutes);
  app.use('/api/v1/reminders', reminderRoutes);
  app.use('/api/v1/payment-terms', paymentTermRoutes);
  app.use("/api/v1/whatsapp", whatsappRoutes);
  app.use("/", whatsappWebhookRoutes);
  app.use("/api/v1/notification", notificationRoutes);
}

export default routes;