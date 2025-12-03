import customerRoutes from './customer.routes.js';

const routes = (app) => {
  app.use('/api/v1/customer', customerRoutes);
}

export default routes;