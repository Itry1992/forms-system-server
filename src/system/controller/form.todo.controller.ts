import {Controller, Get, Param, Query, Req, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import {FormTodoService} from "../service/form.todo.service";
import FormTodo from "../../entity/form.todo.entity";
import {Op} from "sequelize";
import {JwtAuthGuard} from "../../auth/auth.guard";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {ResponseUtil} from "../../common/response.util";
import {AdminGuard} from "../../auth/admin.guard";
import {domainToUnicode} from "url";

@Controller('/formTodo')
@ApiTags('待办事项')
export class FormTodoController {
    constructor(private readonly formTodoService: FormTodoService) {
    }

    @Get('/list/:status')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({description: "获取当前登陆用户的代办事项 status===1 代办事项 status===2 已处理事项 "})
    async listByCurrentUser(@Req() req, @Query(PageVoPipe) pageQueryVo: PageQueryVo,@Param('status') status: string) {
        return ResponseUtil.page(await this.formTodoService.findByUser(req.user, pageQueryVo, status))
    }

    @Get('/listALL')
    @UseGuards(JwtAuthGuard,AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({description: "获取全部的代办事项，仅system_admin 可以调用该接口"})
    async listAll(@Query(PageVoPipe) pageQueryVo: PageQueryVo,@Query('userId') userId?: string,@Query('deptId') deptId?: string) {
        return  ResponseUtil.page( await  this.formTodoService.listAll(pageQueryVo,userId,deptId))
    }


}
