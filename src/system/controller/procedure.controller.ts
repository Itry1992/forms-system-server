import {Body, Controller, Get, Param, Post, Query} from "@nestjs/common";
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

    @Post('/create/:formId')
    async add(@Body() procedure: Procedure, @Param('formId') formId: string) {
        procedure.status = '1'
        procedure.formId = formId
        return ResponseUtil.success(await this.procedureService.create(procedure))
    }

    @Post('/update')
    async update(@Body() procedure: Procedure) {
        if (procedure.id)
            return ResponseUtil.success(await this.procedureService.update(procedure))
        return ResponseUtil.noId('Procedure')
    }

    @Get('/delete/:id')
    async delete(@Param('id') id: string) {
        return ResponseUtil.success(await this.procedureService.delete(id))
    }

    @Get('/detail/:id')
    @ApiOperation({description: 'isFormId === true 时 返回表单对应的流程'})
    async detail(@Param('id') id: string, @Query('isFormId') isFormId) {
        if (isFormId && typeof isFormId === 'string') {
            isFormId = isFormId === 'true'
        }
        return ResponseUtil.success(await this.procedureService.detail(id, isFormId))
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
        return  ResponseUtil.success(await  this.procedureService.deleteNode(id))
    }

}
