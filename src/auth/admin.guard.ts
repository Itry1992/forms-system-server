/**
 * JwtAuth guard.
 * @file 鉴权卫士
 * @module guard/auth
 * @author Surmon <https://github.com/surmon-china>
 */

import { AuthGuard } from '@nestjs/passport';
import {BadRequestException, ExecutionContext, Injectable} from '@nestjs/common';

/**
 * @class JwtAuthGuard
 * @classdesc 检验规则：Token 是否存在 -> Token 是否在有效期内 -> Token 解析出的数据是否对的上
 * @example @UseGuards(JwtAuthGuard)
 */
@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request =  context.switchToHttp().getRequest()
    if (request.user.sysRole && request.user.sysRole.name ==='systemAdmin' || request.user.sysRole.name === 'deptAdmin')
      return  true
    else
      throw new BadRequestException('需要部门管理员权限')
  }

}
