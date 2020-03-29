import {Body, Controller, Get, Param, Post, Query, Req, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";
import {JwtAuthGuard} from "../../auth/auth.guard";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import FormComment from "../../entity/form.comment.entity";
import FormTodo from "../../entity/form.todo.entity";
import {ResponseUtil} from "../../common/response.util";

@Controller('/formComment')
@ApiTags('评论')
export class FormCommentController {
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('/list/:todoId')
    async list(@Query(PageVoPipe) pageQueryVo: PageQueryVo, @Param('todoId') todoId: string) {
        const todo: FormTodo = await FormTodo.findByPk(todoId)
        if (!todo)
            return ResponseUtil.error('no entity todo whit ' + todoId)
        const page = await FormComment.findAndCountAll({
            where: {
                formId: todo.formId,
                groupId: todo.formDataGroup
            },
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset()
        })
        return ResponseUtil.page(page)
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('/add/:todoId')
    async add(@Body() comment: FormComment, @Req() req, @Param('todoId') todoId: string) {
        const todo: FormTodo = await FormTodo.findByPk(todoId)
        if (!todo)
            return ResponseUtil.error('no entity todo whit ' + todoId)
        comment.formId = todo.formId
        comment.groupId  = todo.formDataGroup
        comment.createUserId = req.user.id
        comment.createUserName = req.user.name
        return ResponseUtil.success(await FormComment.create(comment))
    }

    @Get('/delete/:id')
    async delete(@Param('id') id: string) {

        return ResponseUtil.success(await FormComment.destroy({where: {id}}))
    }


}
