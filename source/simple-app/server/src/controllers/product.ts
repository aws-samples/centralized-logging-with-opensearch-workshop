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

import { Context } from 'koa';
import { ProductType } from '../entity/productType';
import { getManager } from 'typeorm';
  
import { Product } from '../entity/product';
import {MOCK_PRODUCTS, MOCK_PRODUCTS_TYPE} from "./mockdata";

export default class ProductController {

  public static async importDemoData(ctx: Context) {

    await getManager()
    .createQueryBuilder()
    .insert()
    .into(ProductType)
    .values(MOCK_PRODUCTS_TYPE)
    .execute();

    const importRes = await getManager()
    .createQueryBuilder()
    .insert()
    .into(Product)
    .values(MOCK_PRODUCTS)
    .execute();
    
    ctx.status = 200;
    ctx.body = importRes;
  }

  public static async listProduct(ctx: Context) {
    ctx.body = 'List Product controller';
    const productRepository = getManager().getRepository(Product);
    const products = await productRepository.find();
  
    ctx.status = 200;
    ctx.body = products;
  }

  public static async addProduct(ctx: Context) {
    ctx.body = 'Add Product controller';
    console.log(ctx.request.body);
    const data: Product = ctx.request.body
    const addRes = await getManager()
    .createQueryBuilder()
    .insert()
    .into(Product)
    .values([data])
    .execute();
  
    ctx.status = 200;
    ctx.body = addRes;
  }

  public static async getProductByType(ctx: Context) {
    ctx.body = `getProductByType controller with typeId = ${ctx.params.typeId}`;
    // const productRepository = getManager().getRepository(Product);
    console.info(ctx.params.typeId)
    const products = await getManager().createQueryBuilder(Product, "product").where("product.productTypeId = :id", { id: ctx.params.typeId }).getMany();
  
    if (products) {
      ctx.status = 200;
      ctx.body = products;
    } else {
      ctx.status = 404;
    }
  }

  public static async showProductDetail(ctx: Context) {
    ctx.body = `showProductDetail controller with ID = ${ctx.params.id}`;
    const productRepository = getManager().getRepository(Product);
    const products = await productRepository.findOne(+ctx.params.id);
  
    if (products) {
      ctx.status = 200;
      ctx.body = products;
    } else {
      ctx.status = 404;
    }
  }

}