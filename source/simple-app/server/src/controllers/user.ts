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