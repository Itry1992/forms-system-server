import {Body, Controller, Get, Param, Post, Query, Req, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";
import {JwtAuthGuard} from "../../auth/auth.guard";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import FormComment from "../../entity/form.comment.entity";
import FormTodo from "../../entity/form.todo.entity";
import {ResponseUtil} from "../../common/response.util";
import {FormTodoService} from "../service/form.todo.service";

@Controller('/formComment')
@ApiTags('评论')
export class FormCommentController {
    constructor(private readonly formTodoService: FormTodoService) {
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('/list')
    async list(@Query(PageVoPipe) pageQueryVo: PageQueryVo, @Query('todoId') todoId: string,
               @Query('formDataId') formDataId: string) {

        const d = await this.formTodoService.getGroup(todoId, formDataId)
        const page = await FormComment.findAndCountAll({
            where: {
                formId: d.formId,
                groupId: d.formDataGroup
            },
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset()
        })
        return ResponseUtil.page(page)
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('/add')
    async add(@Body() comment: FormComment, @Req() req, @Query('todoId') todoId: string,
              @Query('formDataId') formDataId: string) {

        const d = await  this.formTodoService.getGroup(todoId,formDataId)
        comment.formId = d.formId
        comment.groupId = d.formDataGroup
        comment.createUserId = req.user.id
        comment.createUserName = req.user.name
        return ResponseUtil.success(await FormComment.create(comment))
    }

    @Get('/delete/:id')
    async delete(@Param('id') id: string) {

        return ResponseUtil.success(await FormComment.destroy({where: {id}}))
    }


}
