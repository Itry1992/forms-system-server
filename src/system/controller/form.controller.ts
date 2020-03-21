import {Body, Controller, Get, Param, Post, Query, Req, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {DeptService} from "../service/dept.service";
import Dept from "../../entity/Dept.entity";
import {DeptTreeDto} from "../dto/dept.tree.dto";
import {JwtAuthGuard} from "../../auth/auth.guard";
import {FormService} from "../service/form.service";
import {ResponseUtil} from "../../common/response.util";
import Form from "../../entity/form.entity";
import {FormCreateDto} from "../dto/form.create.dto";

@Controller('/form')
@ApiTags('form')
export class FormController {
    constructor(private readonly deptService: DeptService,
                private readonly formService: FormService) {
    }

    @Get('/list')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({description: '如果未传递deptId 则为当前登陆人员所在部门的表单 以及其下级部门的表单'})
    async list(@Query(PageVoPipe) pageQueryVo: PageQueryVo, @Req() req
        , @Query('name') name?: string
        , @Query('deptId') deptId?: string) {
        if (!deptId) {
            deptId = req.user.depts[0].id
        }
        const dept = await Dept.findByPk(deptId)
        const data = await this.deptService.findNext(DeptTreeDto.byDept(dept))
        const deptIds = []
        this.getIds(data, deptIds)
        const res = await this.formService.list(pageQueryVo, name, deptIds)
        return ResponseUtil.page(res)
    }

    @Post('/add')
    @ApiOperation({description: '将表单归属于当前用户所在部门'})
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async create(@Body() form: FormCreateDto) {
        form.status = '1'
        const data = await this.formService.create(form)
        return ResponseUtil.success(data)
    }

    // @Post('/update2/:formId')
    // @ApiOperation

    @Post('/update/:formId')
    // @ApiBearerAuth
    async update(@Body()form: Form, @Param('formId')formId: string) {
        await this.formService.update(formId, form)
        return ResponseUtil.success()
    }


    @Get('/delete/:formId')
    async delete(@Param('formId')formId: string) {
        await  this.formService.delete(formId)
        return ResponseUtil.success()
    }

    private getIds(data: DeptTreeDto, ids: string[]) {
        ids.push(data.id)
        if (data.children) {
            data.children.forEach(d => {
                this.getIds(d, ids)
            })
        }
    }

}
