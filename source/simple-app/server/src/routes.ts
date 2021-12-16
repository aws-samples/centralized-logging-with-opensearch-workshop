import Router from '@koa/router';

import UserController from './controllers/user';
import ProductController from './controllers/product';
import ProductTypeController from './controllers/productType';


const router = new Router();

// users 相关的路由
router.get('/users', UserController.listUsers);
router.get('/users/:id', UserController.showUserDetail);
router.put('/users/:id', UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);

// Mock Data相关路由
router.post('/importdemodata', ProductController.importDemoData);

// product 相关的路由
router.get('/products', ProductController.listProduct);
router.post('/product', ProductController.addProduct);
router.get('/products/type/:typeId', ProductController.getProductByType);
router.get('/products/detail/:id', ProductController.showProductDetail);

// productType 相关的路由
router.get('/producttypes', ProductTypeController.listProductType);

export default router;