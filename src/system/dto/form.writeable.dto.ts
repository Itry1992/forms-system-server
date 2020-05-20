import {ApiHideProperty} from "@nestjs/swagger";

export class FormWriteableDto {
    @ApiHideProperty()
    users: { id: string, name: string }[]
    @ApiHideProperty()
    depts: { id: string, name: string }[]
    publicUrl?: string
    @ApiHideProperty()
    roles: { id: string, name: string }[]
}
