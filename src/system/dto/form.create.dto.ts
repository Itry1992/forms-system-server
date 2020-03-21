import {ApiHideProperty} from "@nestjs/swagger";

export class FormCreateDto {
    name: string
    icon: string
    type: string
    @ApiHideProperty()
    status? : string
}
