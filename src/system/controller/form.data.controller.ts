import {Body, Controller, Get, Param, Post, Query, Req} from "@nestjs/common";
import {ApiOperation, ApiTags} from "@nestjs/swagger";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {FormDataService} from "../service/form.data.service";
import {ResponseUtil} from "../../common/response.util";
import {Request} from "express";

@Controller('/formData')
@ApiTags('formData')
export class FormDataController {
    constructor(private readonly formDataService: FormDataService) {
    }

    @Get('/list/:formId')
    async list(@Query(PageVoPipe) pageQueryVo: PageQueryVo, @Param('formId')formId: string) {
        const data = await this.formDataService.list(pageQueryVo, formId)
        return ResponseUtil.success(data)
    }

    @Post('/add/:formId')
    async create(@Body()data, @Param('formId')formId: string,@Req() req:Request) {
        const ip = req.ip
        const res = await  this.formDataService.add(data,formId,ip)
        return ResponseUtil.success(res)
    }

    @Post('/update/:formDataId')
    async update(@Param('formDataId') formDataId: string,@Body() data) {
        await this.formDataService.update(data,formDataId)
        return ResponseUtil.success()
    }
}
