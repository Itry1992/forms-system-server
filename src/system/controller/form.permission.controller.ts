import {Body, Controller, Get, Param, Post, Query, Req, UseGuards} from "@nestjs/common";
import {ApiOperation, ApiTags} from "@nestjs/swagger";
import {ResponseUtil} from "../../common/response.util";
import {FormPermissionService} from "../service/form.permission.service";
import FormPermission from "../../entity/form.permission.entity";
import {JwtAuthGuard} from "../../auth/auth.guard";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";

@Controller('/formPermission')
@ApiTags('表单数据权限')
export class FormPermissionController {
    constructor(private readonly formPermissionService: FormPermissionService) {
    }

    @Get('/get/:formId')
    @ApiOperation({description: '数据回填'})
    async getByFormId(@Param('formId') formId: string) {
        return ResponseUtil.success(await this.formPermissionService.findByFormId(formId))
    }

    @Post('/updateOrAdd/:formId')
    async upsert(@Body()formPermission: FormPermission, @Param('formId') formId: string) {
        formPermission.formId = formId
        return ResponseUtil.success(await this.formPermissionService.upsert(formPermission))
    }

    @Get('showAbleList')
    @ApiOperation({description: '具有查看权限的表单列表'})
    @UseGuards(JwtAuthGuard)
    async showAbleList(@Req() req, @Query(PageVoPipe) pageQueryVo: PageQueryVo) {
        return ResponseUtil.page(await this.formPermissionService.showAbleList(req.user, pageQueryVo))
    }


}
