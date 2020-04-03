/**
 * JwtAuth guard.
 * @file 鉴权卫士
 * @module guard/auth
 * @author Surmon <https://github.com/surmon-china>
 */

import {AuthGuard} from '@nestjs/passport';
import {BadRequestException, CanActivate, ExecutionContext, Injectable, UnauthorizedException} from '@nestjs/common';
import {AuthService} from "./auth.service";
import User from "../entity/User.entity";
import SysRole from "../entity/sys.role.entity";
import Dept from "../entity/Dept.entity";

/**
 * @class JwtAuthGuard
 * @classdesc 检验规则：Token 是否存在 -> Token 是否在有效期内 -> Token 解析出的数据是否对的上
 * @example @UseGuards(JwtAuthGuard)
 */
// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {
//     constructor(private readonly authService: AuthService) {
//         super();
//     }
//
//     canActivate(context: ExecutionContext) {
//         const request = context.switchToHttp().getRequest()
//         const header = request.header('Authorization')
//         if (!header)
//             throw new BadRequestException('no token')
//         const e = this.authService.verify(header.substring(7)).then().catch((e) => {
//             return e
//         })
//
//         return super.canActivate(context);
//         // return true
//     }
//
// }
@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly authService: AuthService) {

    }

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const header = request.header('Authorization')
        if (!header)
            throw new BadRequestException('请登陆')
        const payload = this.authService.verify(header.substring(7)).then((payload) => {
            return payload
        }).catch((e) => {
            throw new BadRequestException('jwt expired')
        })
        const {account, pwd} = await payload;
        const user = await User.findOne({
            where: {
                account,
                pwd
            },
            include: [
                {model: SysRole},
                {model: Dept}
            ]
        });
        if (!user) {
            throw  new UnauthorizedException();
        }
        request.user = user
        return true;

    }
}
