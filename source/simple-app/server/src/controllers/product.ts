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