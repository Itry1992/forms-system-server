import {ApiHideProperty, ApiOperation, ApiProperty} from "@nestjs/swagger";
import {PageQueryVo} from "../../common/pageQuery.vo";

export class FormDataQueryDto extends PageQueryVo{
    @ApiProperty({description: "初始节点 可以使用start 结束节点可以使用end"})
    nodeId: string
    // status: 'start'|'end'|'task'
    fliedQuery: FliedQuery[]
}

export interface FliedQuery {
    itemId: string
    method: 'gt'|'gte'|'lt'|'lte'|'eq'|'null'|'not null'
    value: any
}
