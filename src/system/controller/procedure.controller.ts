import {BadRequestException, Body, Controller, Get, Param, Post, Query} from "@nestjs/common";
import {ProcedureService} from "../service/procedure.service";
import {ApiOperation, ApiTags} from "@nestjs/swagger";
import Procedure from "../../entity/procedure.entity";
import {ResponseUtil} from "../../common/response.util";
import ProcedureNode from "../../entity/procedure.node.entity";
import FormData from "../../entity/form.data.entity";
import FormTodo from "../../entity/form.todo.entity";
import {ArrayUtil} from "../../common/util/array.util";

@Controller('/procedure')
@ApiTags('流程以及流程节点')
export class ProcedureController {
    constructor(private readonly procedureService: ProcedureService) {
    }

    @Post('/updateOrAdd/:formId')
    @ApiOperation({description: '支持 node and edge 同时传递'})
    async update(@Body() procedure: Procedure, @Param('formId') formId: string) {
        //检验是否有表单数据


        procedure.formId = formId
        if (!procedure.nodes || !procedure.edges) {
            throw new BadRequestException('请设置节点 和 流转条件')
        }
        if (procedure.nodes) {
            procedure.nodes.forEach((node) => {
                if (!node.id)
                    throw new BadRequestException('has procedure node with no id')
                if (node.clazz !== 'end')
                    if (!node.letter || node.letter.length === 0) {
                        throw  new BadRequestException(`${node.label} 没有可见/可编辑字段`)
                    }
                if (node.clazz === 'userTask' || node.clazz === 'receiveTask')
                    if (ArrayUtil.isNull(node.assignPerson) && ArrayUtil.isNull(node.assignDept)) {
                        throw new BadRequestException(`${node.label} 没有审批人`)
                    }
                if (node.clazz==='end') {
                    node.assignDept= []
                    node.assignPerson = []
                    if (!node.letter)
                        node.letter = []
                }
            })
        }

        const todo = await FormTodo.findOne({
            where: {
                formId: formId
            }
        })
        if (todo) {
            throw new BadRequestException('此表单已有数据，无法修改流程')
        }

        return ResponseUtil.success(await this.procedureService.upsert(procedure, formId))
        // return ResponseUtil.create()
    }

    @Get('/delete/:formId')
    async delete(@Param('formId') formId: string) {
        //检验是否有表单数据
        const todo = await FormTodo.findOne({
            where: {
                formId: formId
            }
        })
        if (todo) {
            throw new BadRequestException('此表单已有数据，无法修改流程')
        }
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
