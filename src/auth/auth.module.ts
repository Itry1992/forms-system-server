import {Module} from '@nestjs/common';
import {AuthService} from './auth.service';

import {JwtModule} from '@nestjs/jwt';

import {AuthController} from './auth.controller';
import {JwtStrategy} from './jwt.strategy';
import {jwtConstants} from './constants';
import {PassportModule} from '@nestjs/passport';

@Module({
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    imports: [
        JwtModule.register({
                secret: jwtConstants.secret,
                signOptions: {
                    expiresIn: '12h'
                }
            }
        ),
        PassportModule.register({defaultStrategy: 'jwt'})],
    exports: [AuthService,PassportModule],
})
export class AuthModule {
}
