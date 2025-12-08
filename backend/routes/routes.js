import customerRoutes from './customer.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';

const routes = (app) => {
  app.use('/api/v1/customers', customerRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/user',userRoutes);
}



export default routes;