import {ApiProperty} from "@nestjs/swagger";

export class RegisterDto {
    account: string
    pwd: string
    name: string
    @ApiProperty({description: '角色额外注册信息 任意json数据'})
    registerData: any
    roleId: string
    deptId: string
}
