import {Controller, Get, Param, Query, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import LogProcedure from "../../entity/log.procedure.entity";
import {JwtAuthGuard} from "../../auth/auth.guard";
import FormTodo from "../../entity/form.todo.entity";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {ResponseUtil} from "../../common/response.util";
import User from "../../entity/User.entity";
import ProcedureNode from "../../entity/procedure.node.entity";

@Controller('formLog')
@ApiTags('表单日志/流程日志')
export class FormLogController {
    @Get('/all/:todoId')
    @ApiOperation({description: '流程日志'})
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async all(@Param('todoId') todoId: string, @Query(PageVoPipe) pageQueryVo: PageQueryVo) {
        const todo: FormTodo = await FormTodo.findByPk(todoId)
        if (todo) {
            const page = await LogProcedure.findAndCountAll({
                where: {
                    formId: todo.formId,
                    groupId: todo.formDataGroup
                },
                include: [{
                    model: User,
                    attributes: ['name']
                }, {model: ProcedureNode,
                    attributes:['label']}],
                limit: pageQueryVo.getSize(),
                offset: pageQueryVo.offset()
            })
            return ResponseUtil.page(page)
        }
        return ResponseUtil.error('no todo')
    }

}
