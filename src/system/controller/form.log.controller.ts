import {BadRequestException, Controller, Get, Param, Query, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import LogProcedure from "../../entity/log.procedure.entity";
import {JwtAuthGuard} from "../../auth/auth.guard";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {ResponseUtil} from "../../common/response.util";
import User from "../../entity/User.entity";
import ProcedureNode from "../../entity/procedure.node.entity";
import {FormTodoService} from "../service/form.todo.service";

@Controller('formLog')
@ApiTags('表单日志/流程日志')
export class FormLogController {
    constructor(private readonly formTodoService: FormTodoService) {
    }

    @Get('/all')
    @ApiOperation({description: '流程日志'})
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async all(@Query('todoId') todoId: string, @Query('formDataId') formDataId: string, @Query(PageVoPipe) pageQueryVo: PageQueryVo) {
        const d = await this.formTodoService.getGroup(todoId, formDataId)

        const page = await LogProcedure.findAndCountAll({
            where: {
                formId: d.formId,
                groupId: d.formDataGroup
            },
            include: [{
                model: User,
                attributes: ['name']
            }, {
                model: ProcedureNode,
                attributes: ['label']
            }],
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset()
        })
        return ResponseUtil.page(page)


    }

}
