import { Context } from 'koa';
import { getManager } from 'typeorm';
  
import { User } from '../entity/user';

export default class UserController {
  public static async listUsers(ctx: Context) {
    ctx.body = 'ListUsers controller';
    const userRepository = getManager().getRepository(User);
    const users = await userRepository.find();
  
    ctx.status = 200;
    ctx.body = users;
  }

  public static async showUserDetail(ctx: Context) {
    ctx.body = `ShowUserDetail controller with ID = ${ctx.params.id}`;
    const userRepository = getManager().getRepository(User);
    const user = await userRepository.findOne(+ctx.params.id);
  
    if (user) {
      ctx.status = 200;
      ctx.body = user;
    } else {
      ctx.status = 404;
    }
  }

  public static async updateUser(ctx: Context) {
    ctx.body = `UpdateUser controller with ID = ${ctx.params.id}`;
    const userRepository = getManager().getRepository(User);
    await userRepository.update(+ctx.params.id, ctx.request.body);
    const updatedUser = await userRepository.findOne(+ctx.params.id);
  
    if (updatedUser) {
      ctx.status = 200;
      ctx.body = updatedUser;
    } else {
      ctx.status = 404;
    }
  }

  public static async deleteUser(ctx: Context) {
    ctx.body = `DeleteUser controller with ID = ${ctx.params.id}`;
    const userRepository = getManager().getRepository(User);
    await userRepository.delete(+ctx.params.id);
  
    ctx.status = 204;
  }
}