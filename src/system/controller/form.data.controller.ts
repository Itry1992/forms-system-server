import {BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards} from "@nestjs/common";
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
import Form from "../../entity/form.entity";
import ProcedureNode from "../../entity/procedure.node.entity";
import {Op, where} from "sequelize";
import {FormDataQueryDto} from "../dto/form.data.query.dto";

@Controller('/formData')
@ApiTags('formData')
export class FormDataController {
    constructor(private readonly formDataService: FormDataService,
                private readonly authService: AuthService,
                private readonly formTodoService: FormTodoService,
                private readonly formService: FormService) {
    }

    @Post('/list/:formId')
    @ApiOperation({description: '返回全部的数据'})
    async list( @Param('formId')formId: string, @Body() formDataQueryDto: FormDataQueryDto,@Body(PageVoPipe) pageQueryVo: PageQueryVo) {
        const form: Form = await Form.findByPk(formId)
        if (!form)
            throw new BadRequestException('no form whit this id')
        const data = await this.formDataService.list(pageQueryVo, formId,formDataQueryDto)
        const res: any = ResponseUtil.page(data)
        res.items = form.items
        res.qrCode = form.qrCode
        return res
    }

    @Get('/finishedByUser/list')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({description: '表单数据'})
    async finishedByUser(@Req() req, @Query(PageVoPipe) pageQueryVo: PageQueryVo, @Query('formId') formId: string) {
        // debugger
        const user: User = req.user
        const page = await FormData.findAndCountAll({
            where: {
                createUserId: user.id,
                endData: 'end',
                formId,
            },
            include: [{
                model: Form,
                attributes: ['name', 'id']
            }],
            attributes: {exclude: ['data']},
            order: [['updatedAt', 'DESC']],
            limit: pageQueryVo.limit(),
            offset: pageQueryVo.offset()
        })
        return ResponseUtil.page(page)
    }

    @Get('/finishedByUser/detail/:id')
    @ApiOperation({description: '表单数据 我发起的/我完成的查看详情'})
    async finishedByUserDetail(@Param('id') id: string) {
        const formData: FormData = await FormData.findByPk(id, {
            include: [{
                model: Form,
            }]
        })
        if (!formData) {
            throw new BadRequestException('no formData whit id ' + id)
        }
        //filter items
        const form = formData.form
        //根据data过滤
        const items = formData.form.items.filter((i) => {
            return !!formData.data[i.id]
        }).map((i) => {
            i.visible = true
            i.enable = false
            return i
        })
        form.items = items
        return {success: true, data: {data: formData.data, todoId: formData.todoId, form, status: '2', formDataId: id}}
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
        const form = await Form.findByPk(formId)
        if (!form) {
            return ResponseUtil.error('该表单已经被删除')
        }
        if ((form.publicUrl==='0'||!form.publicUrl) && !user)
            throw new BadRequestException('该表单已需要登陆')

        const result = await this.formDataService.submit(data, form, req.ip, user)
        return ResponseUtil.success(result)
    }

    @Get('/toSubmit/:todoId')
    @ApiOperation({description: '入口代办事项 参数为代办事项id , 返回上一节点表单的的值'})
    async toSubmit(@Param('todoId') todoId: string) {

        const todo: FormTodo = await this.formTodoService.findByPK(todoId)
        if (!todo)
            return ResponseUtil.error('no entity whit this id')
        const form: Form = await Form.findByPk(todo.formId)
        if (!form) {
            FormTodo.destroy({
                where: {id: todoId}
            })
            throw new BadRequestException('对应表单不存在')
        }

        const formData: FormData = await this.formDataService.findByTodo(todo)

        const res = await this.formService.toSubmit(form, todo.edge.target)
        res.form.items = res.items
        return {success: true, data: {form: res.form, data: formData.data, todoId, node: res.node, status: todo.status}}
    }

    @Get('/refuse/:todoId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async reBack(@Param('todoId') todoId: string, @Req() req) {
        return ResponseUtil.success(await this.formDataService.reBack(todoId, req.user))
    }

    @Post('/end/:todoId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({description: '结束流程'})
    async end(@Param('todoId') todoId: string, @Req() req, @Body() formDataSubmitDto: FormDataSubmitDto) {
        return ResponseUtil.success(await this.formDataService.end(todoId, req.user, formDataSubmitDto))
    }


    @Get('/toHistory/:todoId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({description: '获取已完成代办事项对应的id'})
    async history(@Param('todoId') todoId: string) {
        const todo: FormTodo = await this.formTodoService.findByPK(todoId)
        if (!todo)
            throw new BadRequestException('no entity todo with this id')
        if (todo.status !== '2')
            throw new BadRequestException('待办事项未处理')
        const form: Form = await Form.findByPk(todo.formId)
        if (!form)
            throw new BadRequestException('对应表单不存在')
        const res = await this.formService.toSubmit(form, todo.edge.target)
        res.items.forEach((i) => {
            i.enable = false
        })
        res.form.items = res.items

        //data
        let formData;
        if (todo.type === 'receiveTask') {
            if (todo.preTodoId)
                formData = await this.formDataService.findByTodoId(todo.preTodoId)
            else
                formData = await this.formDataService.findByTodo(todo, todo.edge.source)
        } else
            formData = await this.formDataService.findByTodoId(todoId)
        return {success: true, data: {form: res.form, data: formData && formData.data, todoId, status: todo.status}}
    }

    @Get('/allSuggest')
    async allSuggest(@Query('todoId') todoId: string, @Query('formDataId') formDataId?: string) {
        const d = await this.formTodoService.getGroup(todoId, formDataId)
        const data: FormData[] = await FormData.findAll({
            where: {
                formId: d.formId,
                dataGroup: d.formDataGroup
            }, include: [{
                model: ProcedureNode,
                where: {
                    clazz: {[Op.ne]: 'start'}
                },
                attributes: ['label']
            }],
            attributes: {
                exclude: ['data']
            }

        })

        return ResponseUtil.success(data)
    }

    @Get('cancel/:id')
    async cancel(@Param('id') id: string) {
        return ResponseUtil.success(await this.formDataService.cancel(id))
    }
}


