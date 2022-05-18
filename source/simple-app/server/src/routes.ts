/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import Router from '@koa/router';

import UserController from './controllers/user';
import ProductController from './controllers/product';
import ProductTypeController from './controllers/productType';
import WorkshopController from './controllers/workshop';

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

// workshop senario
router.get('/slow/products/detail/:id', WorkshopController.slowQueryProductDetail)
export default router;