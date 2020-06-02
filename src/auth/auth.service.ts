import {Injectable, Inject, forwardRef} from '@nestjs/common';

import {JwtService} from '@nestjs/jwt';
import User from "../entity/User.entity";
import Dept from "../entity/Dept.entity";
import SysRole from "../entity/sys.role.entity";
import Role from "../entity/Role.entity";
import {Promise} from "sequelize/types/lib/promise";


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
            },{
                model:SysRole,
                attributes:['id','name']
            },{
                model: Role
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

    async getUserByHeader(req): Promise<User | null>{
        const header = req.header('Authorization')
        if (header) {
            // 提取当前登陆人员
            const {account, pwd} = await this.verify(header.substring(7))
            // console.log(account,pwd)
            return  User.findOne({
                where: {
                    account,
                    pwd
                }, include: [{
                    model: Dept
                }]
            })
        }
    }
}
