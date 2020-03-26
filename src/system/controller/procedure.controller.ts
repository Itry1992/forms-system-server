import {BadRequestException, Body, Controller, Get, Param, Post, Query} from "@nestjs/common";
import {ProcedureService} from "../service/procedure.service";
import {ApiOperation, ApiTags} from "@nestjs/swagger";
import Procedure from "../../entity/procedure.entity";
import {ResponseUtil} from "../../common/response.util";
import ProcedureNode from "../../entity/procedure.node.entity";

@Controller('/procedure')
@ApiTags('流程以及流程节点')
export class ProcedureController {
    constructor(private readonly procedureService: ProcedureService) {
    }

    // @Get('/allByFormId/:formId')
    // async getAll(@Param('formId') formId: string) {
    //     return ResponseUtil.success(await this.procedureService.getAll(formId))
    // }

    // @Post('/create/:formId')
    // async add(@Body() procedure: Procedure, @Param('formId') formId: string) {
    //     procedure.status = '1'
    //     procedure.formId = formId
    //     return ResponseUtil.success(await this.procedureService.create(procedure))
    // }

    @Post('/updateOrAdd/:formId')
    @ApiOperation({description: '支持 node and edge 同时传递'})
    async update(@Body() procedure: Procedure, @Param('formId') formId: string) {
        procedure.formId = formId
        console.log(procedure.nodes)
        if (procedure.nodes) {
            procedure.nodes.forEach((node) => {
                if (!node.id)
                    throw new BadRequestException('has procedure node with no id')
            })
        }
        return ResponseUtil.success(await this.procedureService.upsert(procedure, formId))
        // return ResponseUtil.create()
    }

    @Get('/delete/:formId')
    async delete(@Param('formId') formId: string) {
        return ResponseUtil.success(await this.procedureService.deleteByFormId(formId))
    }

    @Get('/detail/:id')
    @ApiOperation({description: 'isFormId === true 时 返回表单对应的流程'})
    async detail(@Param('id') id: string) {
        return ResponseUtil.success(await this.procedureService.detailByFormId(id))
    }

    @Post('node/addOrUpdate')
    @ApiOperation({description: '如果有id 则为更新 没有为创建 请保证procedureId 不为空'})
    async addNode(@Body()procedureNode: ProcedureNode) {
        if (!procedureNode.procedureId)
            return ResponseUtil.noId('procedure')
        // procedureNode.procedureId = procedureId
        return ResponseUtil.success(await this.procedureService.createNode(procedureNode))
    }

    @Get('/node/delete/:id')
    async deleteNode(@Param('id') id: string) {
        return ResponseUtil.success(await this.procedureService.deleteNode(id))
    }

}
