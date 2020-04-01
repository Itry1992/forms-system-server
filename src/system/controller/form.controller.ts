import {BadRequestException, Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards} from "@nestjs/common";
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
import {domainToUnicode} from "url";
import {FormExportDto} from "../dto/form.export.dto";
import FormData from "../../entity/form.data.entity";
import {Response} from 'express';
import * as fs from "fs";
import {XlsxService} from "../service/xlsx.service";
import {FormWriteableDto} from "../dto/form.writeable.dto";
import User from "../../entity/User.entity";
import {Op} from "sequelize";
import {ArrayUtil} from "../../common/util/array.util";

@Controller('/form')
@ApiTags('form')
export class FormController {
    constructor(private readonly deptService: DeptService,
                private readonly formService: FormService,
                private readonly xlsxService: XlsxService) {
    }

    @Get('/list')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({description: '如果未传递deptId 则为当前登陆人员所在部门的表单 以及其下级部门的表单'})
    async list(@Query(PageVoPipe) pageQueryVo: PageQueryVo, @Req() req
        , @Query('name') name?: string
        , @Query('deptId') deptId?: string) {
        let deptIds = []
        //首先判断是admin
        if (req.user.sysRoleId === '1') {
            if (!deptId)
                deptIds = []
        }
        //不是admin
        if (req.user.sysRoleId !== '1') {
            if (!deptId) {
                if (req.user.depts && req.user.depts.length !== 0)
                    deptId = req.user.depts[0].id
                else
                    return ResponseUtil.error('您没有所在部门')
            }
        }
        if (deptId) {
            const dept = await Dept.findByPk(deptId)
            const data = await this.deptService.findNext(DeptTreeDto.byDept(dept))
            this.getIds(data, deptIds)
        }

        const res = await this.formService.list(pageQueryVo, name, deptIds)
        return ResponseUtil.page(res)
    }

    @Get('/detail/:id')
    async detail(@Param('id') id: string) {
        return ResponseUtil.success(await this.formService.detail(id))
    }

    @Post('/add')
    @ApiOperation({description: '表单将会归属于当前用户所在部门'})
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async create(@Body() form: FormCreateDto, @Req() request) {
        // return  ResponseUtil.error()
        if (!form.deptId)
            if (request.user.depts && request.user.depts.length !== 0)
                form.deptId = request.user.depts[0].id
            else
                return ResponseUtil.error('no dept')
        form.status = '1'
        const data = await this.formService.create(form)
        return ResponseUtil.success(data)
    }

    // @Post('/update2/:formId')
    // @ApiOperation

    @Post('/update/:formId')
    // @ApiBearerAuth
    async update(@Body()form: Form, @Param('formId')formId: string) {
        if (ArrayUtil.isNull(form.items)) {
            throw new BadRequestException('items.length = 0')
        }
        if (form.items) {
            form.items.forEach((item) => {
                if (!item.id)
                    throw new BadRequestException(' has item with no id')
            })
        }
        await this.formService.update(formId, form)
        return ResponseUtil.success()
    }

    @Get('/toSubmit/:id')
    @ApiOperation({description: '初次提交获取itmes'})
    async toSubmit(@Param('id') id: string) {
        //formId
        const form: Form = await Form.findByPk(id)
        if (!form)
            throw new BadRequestException('对应表单不存在')
        const res = await this.formService.toSubmit(form)
        form.items = res.items
        return ResponseUtil.success(form)
    }


    @Get('/delete/:formId')
    async delete(@Param('formId')formId: string) {
        await this.formService.delete(formId)
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

    @Post('/excelExport/:formId')
    async export(@Param('formId') formId: string, @Body() formExportDto: FormExportDto, @Res() res: Response) {
        const form: Form = await Form.findByPk(formId)
        if (!form)
            throw new BadRequestException('no entity form whit  this id ')
        const data: FormData[] = await FormData.findAll({
            where: {
                formId,
                endData: 'end'
            }
        })

        const path = await this.xlsxService.export(data, form, formExportDto)
        const rs = fs.createReadStream(path)
        rs.on('data', chunk => {
            res.write(chunk, 'binary')
        })
        rs.on('end', () => {
            // fs.unlinkSync(path)
            res.end()
        })
    }

    @Post('/updateWriteAble/:formId')
    @ApiOperation({description: '维护 可以填写改表单的用户'})
    async updateUseAbleUser(@Body() formWriteableDto: FormWriteableDto, @Param('formId') formId: string) {
        if (!formWriteableDto.users)
            formWriteableDto.users = []
        if (!formWriteableDto.depts)
            formWriteableDto.depts = []
        if (formWriteableDto.publicUrl)
            formWriteableDto.publicUrl = '0'
        const res = await this.formService.updateWriteAble(formWriteableDto, formId)
        return ResponseUtil.success(res)
    }


    @Get('/getWriteAble/:formId')
    async getWriteAble(@Param('formId') formId: string) {
        const writeableData: Form = await Form.findByPk(formId, {attributes: ['writeAbleUserId', 'writeAbleDeptId', 'publicUrl']})
        if (!writeableData)
            throw new BadRequestException('no form with id ' + formId)
        const writeableDto: any = {}
        writeableDto.publicUrl = writeableData.publicUrl
        const ps = []
        if (writeableData.writeAbleUserId && writeableData.writeAbleUserId.length !== 0) {
            ps.push(User.findAll({
                    where: {
                        id: {[Op.in]: writeableData.writeAbleUserId}
                    }
                }).then(res => {
                    writeableDto.users = res.map((u) => {
                        return {id: u.id, name: u.name}
                    })
                })
            )
        }
        if (writeableData.writeAbleDeptId && writeableData.writeAbleDeptId.length !== 0) {
            ps.push(Dept.findAll({
                    where: {
                        id: {[Op.in]: writeableData.writeAbleDeptId}
                    }
                }).then(res => {
                    writeableDto.depts = res.map((u) => {
                        return {id: u.id, name: u.name}
                    })
                })
            )
        }
        await Promise.all(ps)
        return ResponseUtil.success(writeableDto)
    }

    @Get('/writeAbleList')
    @ApiOperation({description: '当前用户可以填写的表单列表'})
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async writeAbleList(@Req() req, @Query('name') name: string, @Query(PageVoPipe) pageQueryVo: PageQueryVo) {
        const data = await this.formService.writeAbleList(req.user, name, pageQueryVo)
        return ResponseUtil.page(data)
    }


}
