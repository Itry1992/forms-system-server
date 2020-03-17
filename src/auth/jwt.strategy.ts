import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {Injectable, Req, UnauthorizedException} from '@nestjs/common';
import {jwtConstants} from './constants';
import {Json} from "sequelize/types/lib/utils";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret
        });
    }

    async validate(payload: any) {
        // console.log(payload)
        console.log('validate jwt'+ JSON.stringify(payload))
        // console.log(payload)
        const  {account, pwd} = payload;
        // const  user = await User.findOne({where:{
        //         account,
        //         pwd
        //     }});
        const  user = {}
        if (!user) {
            throw  new UnauthorizedException();
        }
        return user;
    }
}
