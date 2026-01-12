import customerRoutes from './customer.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import remainderRoutes from "./remainder.routes.js"
import paymentTermRoutes from './paymentTerm.routes.js';
import whatsappRoutes from "./whatsapp.routes.js"
import whatsappWebhookRoutes from "./whatsappWebhookRoutes.routes.js"

const routes = (app) => {
  app.use('/api/v1/customers', customerRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/user',userRoutes);
  app.use('/api/v1/remainders', remainderRoutes);
  app.use('/api/v1/payment-terms', paymentTermRoutes);
  app.use("/api/v1/whatsapp", whatsappRoutes);
  app.use("/", whatsappWebhookRoutes);
}

export default routes;