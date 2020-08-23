import {ApiHideProperty, ApiOperation, ApiProperty} from "@nestjs/swagger";
import {PageQueryVo} from "../../common/pageQuery.vo";

export class FormDataQueryDto extends PageQueryVo {
    @ApiProperty({description: "初始节点 可以使用start 结束节点可以使用end"})
    nodeId: string
    @ApiProperty({description: "start' | 'end' | 'task' | 'import' 多个值是使用‘，分割’"})
    status: string
    fliedQuery: FliedQuery[]
    checkList: boolean
}

export interface FliedQuery {
    id: string
    method: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'null' | 'notNull' | 'overlap' | 'contained' | 'contains'
    value: any
}
