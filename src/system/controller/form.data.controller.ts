import {Body, Controller, Get, Param, Post, Query, Req, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {FormDataService} from "../service/form.data.service";
import {ResponseUtil} from "../../common/response.util";
import {Request} from "express";
import FormData from "../../entity/form.data.entity";
import {AuthService} from "../../auth/auth.service";
import User from "../../entity/User.entity";
import Dept from "../../entity/Dept.entity";
import {async} from "rxjs/internal/scheduler/async";
import {FormTodoService} from "../service/form.todo.service";
import {ProcedureService} from "../service/procedure.service";
import FormTodo from "../../entity/form.todo.entity";
import {FormService} from "../service/form.service";
import {FormItemInterface} from "../../entity/JSONDataInterface/FormItem.interface";
import {FormDataSubmitDto} from "../dto/form.data.submit.dto";
import {JwtAuthGuard} from "../../auth/auth.guard";

@Controller('/formData')
@ApiTags('formData')
export class FormDataController {
    constructor(private readonly formDataService: FormDataService,
                private readonly authService: AuthService,
                private readonly formTodoService: FormTodoService,
                private readonly formService: FormService) {
    }

    @Get('/list/:formId')
    @ApiOperation({description: '流程表单不会返回未审核数据'})
    async list(@Query(PageVoPipe) pageQueryVo: PageQueryVo, @Param('formId')formId: string) {
        const data = await this.formDataService.list(pageQueryVo, formId)
        return ResponseUtil.success(data)
    }

    @Post('/add/:formId')
    @ApiOperation({description: '用于测试以及 手动添加数据, 不会进行相应的流程管理'})
    async create(@Body()data, @Param('formId')formId: string, @Req() req: Request) {
        const header = req.header('Authorization')
        if (header) {
            // 提取当前登陆人员  待续....
        }
        const ip = req.ip
        const res = await this.formDataService.add(data, formId, ip)
        return ResponseUtil.success(res)
    }

    @Post('/update/:formDataId')
    async update(@Param('formDataId') formDataId: string, @Body() data) {
        await this.formDataService.update(data, formDataId)
        return ResponseUtil.success()
    }

    @Post('/submit/:formId')
    @ApiOperation({
        description: '提交的数据会进入流程处理 审批流程时候请包含todoId  data字段示例 ： {\n' +
            '    "itemId":"a",\n' +
            '    "itemId2":[\n' +
            '        "1",\n' +
            '        "2",\n' +
            '        "3"\n' +
            '    ],\n' +
            '    "itemId3":{\n' +
            '\n' +
            '    }\n' +
            '}'
    })
    async submit(@Body() data: FormDataSubmitDto, @Param('formId') formId: string, @Req() req: Request) {
        const header = req.header('Authorization')
        let user = undefined
        if (header) {
            // 提取当前登陆人员
            const {account, pwd} = await this.authService.verify(header.substring(7))
            // console.log(account,pwd)
            user = await User.findOne({
                where: {
                    account,
                    pwd
                }, include: [{
                    model: Dept
                }]
            })
        }
        const result = await this.formDataService.submit(data, formId, req.ip, user)
        return ResponseUtil.success(result)
    }

    @Get('/toSubmit/:todoId')
    @ApiOperation({description: '入口代办事项 参数为代办事项id , 返回上一节点表单的的值'})
    async toSubmit(@Param('todoId') todoId: string) {
        const todo: FormTodo = await this.formTodoService.findByPK(todoId)
        // console.log(todo)
        const formData: FormData = await this.formDataService.findByTodo(todo)
        const res = await this.formService.toSubmit(todo.formId, todo.edge.target)
        res.form.items = res.items
        return {success: true, data: { form: res.form, data: formData.data, todoId, suggest: res.suggest}}
    }

    @Get('/reBack/:todoId')
    @UseGuards(JwtAuthGuard)
    async reBack(@Param('todoId') todoId: string, @Req() req) {
        return ResponseUtil.success(await this.formDataService.reBack(todoId, req.user))
    }


    @Get('/toHistory/:todoId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({description: '获取已完成代办事项对应的id'})
    async history(@Param('todoId') todoId ) {
        // todo 具体的数据
        const todo: FormTodo = await this.formTodoService.findByPK(todoId)
        const res = await this.formService.toSubmit(todo.formId, todo.edge.target)
        //data
        const  formData  = await  this.formDataService.findByTodo(todo,todo.edge.target)
        return {success: true, data: { form: res.form, data: formData.data, todoId, suggest: res.suggest}}

    }

}


