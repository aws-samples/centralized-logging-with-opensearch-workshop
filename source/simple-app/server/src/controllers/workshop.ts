import { Context } from 'koa';
import { getManager } from 'typeorm';

export default class WorkshopController {
    public static async slowQueryProductDetail(ctx: Context) {
        ctx.body = `generate Slowquery for product ${ctx.params.id}`;

        const products = await getManager().query(`SELECT *, sleep(5) FROM product WHERE id = ${ctx.params.id}`);      
        if (products) {
          ctx.status = 200;
          ctx.body = products[0];
        } else {
          ctx.status = 404;
        }
      }
}
