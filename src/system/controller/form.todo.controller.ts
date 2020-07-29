import {Controller, Get, Param, Query, Req, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import {FormTodoService} from "../service/form.todo.service";
import {JwtAuthGuard} from "../../auth/auth.guard";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {ResponseUtil} from "../../common/response.util";
import {AdminGuard} from "../../auth/admin.guard";
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
    @ApiOperation({description: "获取当前登陆用户的代办事项 status===1 代办事项 status===2 我处理的 3, '抄送' 4 我发起的  6 完成事项"})
    async listByCurrentUser(@Req() req, @Query(PageVoPipe) pageQueryVo: PageQueryVo, @Param('status') status: string, @Query('formId')formId?: string) {
        if (status === '2')
            return ResponseUtil.page(await this.formTodoService.findByUser(req.user, pageQueryVo, null, 'userTask', true, formId))
        if (status === '3')
            return ResponseUtil.page(await this.formTodoService.findByUser(req.user, pageQueryVo, null, 'receiveTask', false, formId))
        if (status === '4')
            // return ResponseUtil.page(await this.formTodoService.createByUser(req.user, pageQueryVo))
            return ResponseUtil.page(await this.formDataService.listByEndData(req.user, pageQueryVo, 'start', formId))
        if (status === '6')
            return ResponseUtil.page(await this.formDataService.listByEndData(req.user, pageQueryVo, 'end', formId))
        if (status === '1')
            return ResponseUtil.page(await this.formTodoService.findByUser(req.user, pageQueryVo, status, 'userTask', false, formId))
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

    @Get('/formGroup/:status')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({description: "status===1 代办事项 status===2 我处理的 3, '抄送' 4 我发起的 5 完成事项"})
    async formGroup(@Req() req, @Param('status')status: string) {
        let dealByUser = false
        let type = 'userTask'
        if (status === '4') {
            return ResponseUtil.success(await this.formDataService.groupByForm('start', req.user))
        }
        if (status === '6')
            return ResponseUtil.success(await this.formDataService.groupByForm('end', req.user))
        if (status === '2') {
            dealByUser = true
        }
        if (status === '3') {
            type = 'receiveTask'
            // status = '2'
        }
        return ResponseUtil.success(await this.formTodoService.groupByForm(req.user, status, type, dealByUser,))
    }


}
