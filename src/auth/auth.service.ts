import {Injectable, Inject, forwardRef} from '@nestjs/common';

import {JwtService} from '@nestjs/jwt';
import User from "../entity/User.entity";
import Dept from "../entity/Dept.entity";


@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
    ) {
    }

    async validateUser(account: string, pwd: string): Promise<any> {
        const user: User = await User.findOne({
            where: {
                account, pwd
            },
            include:[{
                model:Dept,
                attributes:['id','name']
            }]
        });
        if (user) {
            return await this.login({account, pwd}, user);
        }
        return {success: false, message: '用户名或密码错误'};
    }

    async login(payload: any, user: any) {
        user.pwd = null;
        return {
            success: true,
            token: await this.jwtService.signAsync(payload),
            data: user
        };
    }

    async verify(payload: string) {
        return await this.jwtService.verifyAsync(payload);
    }
}
