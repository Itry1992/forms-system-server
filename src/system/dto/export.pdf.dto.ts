import {ApiProperty} from "@nestjs/swagger";

export class ExportPdfDto {
    itemIds: string[]
    @ApiProperty({description: 'end | start| import| task'})
    status: string[]
    page: number
    size: number
    baseUrl : string
}
