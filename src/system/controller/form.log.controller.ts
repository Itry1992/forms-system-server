import {Controller, Get, Param, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import LogProcedure from "../../entity/log.procedure.entity";
import {JwtAuthGuard} from "../../auth/auth.guard";

@Controller('formLog')
@ApiTags('表单日志/流程日志')
export class FormLogController {
    @Get('/all/:formId/:groupId')
    @ApiOperation({description: '流程日志'})
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async all(@Param('formId') formId: string, @Param('groupId') groupId: string) {
        return LogProcedure.findAll({
            where: {
                formId,
                groupId
            }
        })
    }
}
