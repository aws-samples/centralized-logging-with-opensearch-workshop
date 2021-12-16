import { Context } from 'koa';
import { getManager } from 'typeorm';
  
import { ProductType } from '../entity/productType';

export default class ProductTypeController {
  public static async listProductType(ctx: Context) {
    ctx.body = 'List Product Type controller';
    const userRepository = getManager().getRepository(ProductType);
    const users = await userRepository.find();
  
    ctx.status = 200;
    ctx.body = users;
  }

}