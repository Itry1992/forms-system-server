/**
 * JwtAuth guard.
 * @file 鉴权卫士
 * @module guard/auth
 * @author Surmon <https://github.com/surmon-china>
 */

import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, Injectable } from '@nestjs/common';

/**
 * @class JwtAuthGuard
 * @classdesc 检验规则：Token 是否存在 -> Token 是否在有效期内 -> Token 解析出的数据是否对的上
 * @example @UseGuards(JwtAuthGuard)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // console.log('=================================context')
    // console.log(context)
    // console.log(context.switchToHttp().getRequest())
    // // console.log(context.switchToHttp().)
    // console.log('====================end')
    return super.canActivate(context);
  }

}
