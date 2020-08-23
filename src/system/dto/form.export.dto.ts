import {ApiOperation, ApiProperty} from "@nestjs/swagger";
import {FormDataQueryDto} from "./form.data.query.dto";

export class FormExportDto {
    @ApiProperty()
    itemIds: string[]
    @ApiProperty()
    createTime?: boolean
    @ApiProperty()
    createUserName?: boolean
    //审核完成时间
    @ApiProperty()
    produceNodeEndTime?: boolean
    submitUserName?:boolean
    // groupStatus?:boolean
    currentProcedureNode?: boolean
    dataGroupStatus: string


    page: number
    size: number
    formDataQueryDto: FormDataQueryDto


}
