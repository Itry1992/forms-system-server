import {BadRequestException, Body, Controller, Post} from '@nestjs/common';

import {AuthService} from './auth.service';
import {ApiBody, ApiParam, ApiTags} from "@nestjs/swagger";
import {LoginDto} from "./login.dto";


@Controller('/auth')
@ApiTags('登陆')
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }

    @Post('/login')
    async login(@Body() user: LoginDto) {
        return this.authService.validateUser(user.account, user.pwd)
    }
}
