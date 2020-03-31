import {ApiOperation, ApiProperty} from "@nestjs/swagger";

export class FormExportDto {
    @ApiProperty()
    itemIds: string[]
    @ApiProperty()
    createTime?: boolean
    @ApiProperty()
    createUser?: boolean
    //审核完成时间
    @ApiProperty()
    produceNodeEndTime?: boolean

}
