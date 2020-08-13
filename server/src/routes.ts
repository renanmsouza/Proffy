import express from 'express';
import ClassesController from './controllers/ClassesController';
import ConnectionsController from './controllers/ConnectionsController';


const routes = express.Router();
const classesClontroller = new ClassesController();
const connectionsController = new ConnectionsController;

routes.post('/classes', classesClontroller.create);
routes.get('/classes', classesClontroller.index);

routes.post('/connections', connectionsController.create);
routes.get('/connections', connectionsController.index);


export default routes;