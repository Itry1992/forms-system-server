import {Body, Controller, Delete, Get, Param, Post, Query} from "@nestjs/common";
import {DictService} from "../service/dict.service";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import User from "../../entity/User.entity";
import {ResponseUtil} from "../../common/response.util";
import Dict from "../../entity/dict.entity";
import {ApiOperation, ApiProperty, ApiTags} from "@nestjs/swagger";
import DictDetail from "../../entity/dictDetail.entity";

@Controller('/dict')
@ApiTags('dict and dictDetails')
export class DictController {
    constructor(private readonly dictService: DictService) {
    }

    @Get('/list')
    async list(@Query(PageVoPipe) pageQueryVo: PageQueryVo, @Query('name') name?: string) {
        return this.dictService.list(pageQueryVo, name)
    }

    @Post('/add')
    @ApiOperation({description: '不支持同时传递dictDetails 数组'})
    async add(@Body()data: Dict) {
        return this.dictService.create(data)
    }

    @Post('/update')
    @ApiOperation({description: '不支持同时传递dictDetails 数组'})
    async update(@Body() data: Dict) {
        if (data.id) {
            return this.dictService.update(data)
        } else
            return ResponseUtil.error('no id')
    }

    @Get('/delete/:id')
    async delete(@Param('id')id: string) {
        return this.dictService.delete(id)
    }


    @Get('/listDetails')
    async listDetail(@Query('dictId') dictId: string) {
        return this.dictService.listDetails(dictId)
    }


    @Post('/addDetails')
    async addDetails(@Body() data: DictDetail) {
        if (data.dictId) {
            return this.dictService.createDetails(data)
        } else
            return ResponseUtil.error('no dictId')
    }


    @Post('/updateDetails')
    async updateDetails(@Body() data: DictDetail) {
        if (data.dictId && data.id) {
            return  this.dictService.updateDetails(data)
        } else
            return ResponseUtil.error('no dictId/ id')
    }


    @Get('/deleteDetails/:id')
    async deleteDetails(@Param('id')id: string) {
        return this.dictService.deleteDetails(id)
    }

}
