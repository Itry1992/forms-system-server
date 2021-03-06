import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Req,
    Res, UploadedFile,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";
import {ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags} from "@nestjs/swagger";
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
import FormTodo from "../../entity/form.todo.entity";
import {FormDataService} from "../service/form.data.service";
import {userInfo} from "os";
import Role from "../../entity/Role.entity";
import {FileInterceptor} from "@nestjs/platform-express";
import {ExportPdfDto} from "../dto/export.pdf.dto";
import {AuthService} from "../../auth/auth.service";

@Controller('/form')
@ApiTags('form')
export class FormController {
    constructor(private readonly deptService: DeptService,
                private readonly formService: FormService,
                private readonly xlsxService: XlsxService,
                private readonly formDataService: FormDataService,
                private readonly authService: AuthService) {
    }

    @Get('/list')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({description: '???????????????deptId ????????????????????????????????????????????? ??????????????????????????????'})
    async list(@Query(PageVoPipe) pageQueryVo: PageQueryVo, @Req() req
        , @Query('name') name?: string
        , @Query('deptId') deptId?: string) {
        let deptIds = []
        //???????????????admin
        if (req.user.sysRoleId === '1') {
            if (!deptId)
                deptIds = []
        }
        //??????admin
        if (req.user.sysRoleId !== '1') {
            if (!deptId) {
                if (req.user.depts && req.user.depts.length !== 0)
                    deptId = req.user.depts[0].id
                else
                    return ResponseUtil.error('?????????????????????')
            }
        }
        if (deptId) {
            const dept = await Dept.findByPk(deptId)
            let rootId = dept.rootId
            if (dept.rootId || dept.rootId === '0') {
                rootId = dept.id
            }
            deptIds = await this.deptService.getIds(rootId)
        }

        const res = await this.formService.list(pageQueryVo, name, deptIds, req.user?.roles)
        return ResponseUtil.page(res)
    }

    @Get('/detail/:id')
    async detail(@Param('id') id: string) {
        const todo = await FormTodo.findOne({
            where: {
                formId: id
            }
        })
        const data: Form = await this.formService.detail(id)

        return {success: true, data, hasData: !!todo, assetsFrom: data.assetsFrom}
    }

    @Post('/add')
    @ApiOperation({description: '?????????????????????????????????????????????'})
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


    @Post('/update/:formId')
    @ApiOperation({description: '??????'})
    @UseGuards(JwtAuthGuard)
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
    @ApiOperation({description: '??????????????????itmes'})
    async toSubmit(@Param('id') id: string, @Req() req) {
        //formId
        const form: Form = await Form.findByPk(id)
        if (!form) {
            throw new BadRequestException('?????????????????????')
        }
        const user = await this.authService.getUserByHeader(req)
        if (form.publicUrl === '0' && !user?.id)
            throw new BadRequestException('jwt expired')
        const res = await this.formService.toSubmit(form)
        form.items = res.items
        return ResponseUtil.success(form)
    }


    @Get('/delete/:formId')
    async delete(@Param('formId')formId: string) {
        await this.formService.delete(formId)
        return ResponseUtil.success()
    }


    @Post('/updateWriteAble/:formId')
    @ApiOperation({description: '?????? ??????????????????????????????'})
    async updateUseAbleUser(@Body() formWriteableDto: FormWriteableDto, @Param('formId') formId: string) {
        if (!formWriteableDto.users)
            formWriteableDto.users = []
        if (!formWriteableDto.depts)
            formWriteableDto.depts = []
        if (!formWriteableDto.roles)
            formWriteableDto.roles = []
        if (!formWriteableDto.publicUrl)
            formWriteableDto.publicUrl = '0'
        const res = await this.formService.updateWriteAble(formWriteableDto, formId)
        return ResponseUtil.success(res)
    }


    @Get('/getWriteAble/:formId')
    async getWriteAble(@Param('formId') formId: string) {
        const writeableData: Form = await Form.findByPk(formId, {attributes: ['writeAbleUserId', 'writeAbleDeptId', 'writeAbleRoleId', 'publicUrl']})
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
                        return {id: u.id, name: u.name, title: u.name, key: u.id}
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
                        return {id: u.id, name: u.name, title: u.name, key: u.id}
                    })
                })
            )
        }
        if (writeableData.writeAbleRoleId && writeableData.writeAbleRoleId.length !== 0) {
            ps.push(Role.findAll({
                    where: {
                        id: {[Op.in]: writeableData.writeAbleRoleId}
                    }
                }).then(res => {
                    writeableDto.roles = res.map((u) => {
                        return {id: u.id, name: u.name, title: u.name, key: u.id}
                    })
                })
            )
        }
        await Promise.all(ps)
        return ResponseUtil.success(writeableDto)
    }

    @Get('/writeAbleList')
    @ApiOperation({description: '???????????????????????????????????????'})
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async writeAbleList(@Req() req, @Query('name') name: string, @Query(PageVoPipe) pageQueryVo: PageQueryVo) {
        const data = await this.formService.writeAbleList(req.user, name, pageQueryVo)
        return ResponseUtil.page(data)
    }


    @Post('/excelExport/:formId')
    async export(@Param('formId') formId: string, @Body() formExportDto: FormExportDto, @Res() res: Response) {
        const form: Form = await Form.findByPk(formId)
        if (!form)
            throw new BadRequestException('no entity form whit  this id ')
        if (!formExportDto.size) {
            formExportDto.size = 100
        }
        if (!formExportDto.page)
            formExportDto.page = 0
        const data: FormData[] = await this.formDataService.list(new PageQueryVo(formExportDto.size, formExportDto.page), formId, formExportDto.formDataQueryDto, true)

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

    @Post('/excelExportTemplate/:formId')
    async excelExportTemplate(@Param('formId')formId: string, @Res() res: Response) {
        const path = await this.xlsxService.exportTemplate(formId)
        const rs = fs.createReadStream(path)
        rs.on('data', chunk => {
            res.write(chunk, 'binary')
        })
        rs.on('end', () => {
            fs.unlinkSync(path)
            res.end()
        })
    }

    @Post('/importFormExcel/:formId')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    async addFile(@UploadedFile() file: any, @Param('formId') formId: string) {
        if (file)
            return this.xlsxService.importDataByExportTemplate(file.buffer, formId)
        else return ResponseUtil.error('no file')
    }

    @Post('exportAssetsPdf/:formId')
    async exportAssetsPdf(@Body() dto: ExportPdfDto, @Param('formId') formId: string, @Res() res: Response) {
        const filePath = await this.formService.exportAssetsPdf(formId, dto)
        const rs = fs.createReadStream(filePath)
        rs.on('data', chunk => {
            res.write(chunk, 'binary')
        })
        rs.on('end', () => {
            fs.unlinkSync(filePath)
            res.end()
        })
    }


}
