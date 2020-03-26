import {Body, Controller, Get, Param, Post} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {ResponseUtil} from "../../common/response.util";
import {FormPermissionService} from "../service/form.permission.service";
import FormPermission from "../../entity/form.permission.entity";

@Controller('/formPermission')
@ApiTags('表单数据权限')
export class FormPermissionController {
    constructor(private readonly formPermissionService: FormPermissionService) {
    }

    @Get('/get/:formId')
    async getByFormId(@Param('formId') formId: string) {
        return ResponseUtil.success(await this.formPermissionService.findByFormId(formId))
    }

    @Post('/updateOrAdd/:formId')
    async upsert(@Body()formPermission: FormPermission, @Param('formId') formId: string) {
        formPermission.formId = formId
        return ResponseUtil.success( await  this.formPermissionService.upsert(formPermission))
    }


}
