import {ApiProperty} from "@nestjs/swagger";

export class AppUpdateDto {
    icon?: string
    name?: string
    @ApiProperty({description:'拥有者id,只有admin可以修该属性'})
    userId?: string
}
