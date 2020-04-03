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
import {FormDataService} from "../service/form.data.service";

@Controller('/formTodo')
@ApiTags('待办事项')
export class FormTodoController {
    constructor(private readonly formTodoService: FormTodoService,
                private readonly formDataService: FormDataService) {
    }

    @Get('/list/:status')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({description: "获取当前登陆用户的代办事项 status===1 代办事项 status===2 我处理的 3, '抄送' 4 我发起的 "})
    async listByCurrentUser(@Req() req, @Query(PageVoPipe) pageQueryVo: PageQueryVo, @Param('status') status: string) {
        if (status === '2')
            return ResponseUtil.page(await this.formTodoService.findByUser(req.user, pageQueryVo, null, 'userTask', true))
        if (status === '3')
            return ResponseUtil.page(await this.formTodoService.findByUser(req.user, pageQueryVo, null, 'receiveTask'))
        if (status === '4')
            // return ResponseUtil.page(await this.formTodoService.createByUser(req.user, pageQueryVo))
            return  ResponseUtil.page(await this.formDataService.startDataList(req.user,pageQueryVo))
        return ResponseUtil.page(await this.formTodoService.findByUser(req.user, pageQueryVo, status, 'userTask'))
    }

    @Get('/list/dealSelf')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({description: "获取当前登陆用户处理的事项 "})
    async dealSelf(@Req() req, @Query(PageVoPipe) pageQueryVo: PageQueryVo) {
        return ResponseUtil.page(await this.formTodoService.findByUser(req.user, pageQueryVo, null, 'userTask', true))
    }

    @Get('/list/receiveTask')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({description: "获取当前登陆用户的 抄送任务 "})
    async listReceiveTask(@Req() req, @Query(PageVoPipe) pageQueryVo: PageQueryVo, @Param('status') status: string) {
        return ResponseUtil.page(await this.formTodoService.findByUser(req.user, pageQueryVo, null, 'receiveTask'))
    }


    @Get('/listALL')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({description: "获取全部的代办事项，仅system_admin 可以调用该接口"})
    async listAll(@Query(PageVoPipe) pageQueryVo: PageQueryVo, @Query('userId') userId?: string, @Query('deptId') deptId?: string) {
        return ResponseUtil.page(await this.formTodoService.listAll(pageQueryVo, userId, deptId))
    }


}
