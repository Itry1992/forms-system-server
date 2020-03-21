import {Body, Controller, Get, Param, Post, Query, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import {UserService} from "../service/user.service";
import {TestGuard} from "../../auth/test.guard";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {DeptService} from "../service/dept.service";
import User from "../../entity/User.entity";
import {ResponseUtil} from "../../common/response.util";

@Controller('/user/dept')
@ApiTags('用户和部门关系维护')
export class UserDeptController {
    constructor(private readonly userService: UserService,
                private readonly deptService: DeptService) {
    }

    @Get('/list')
    // @UseGuards(TestGuard)
    // @ApiBearerAuth()
    async list(@Query(PageVoPipe) pageVo: PageQueryVo, @Query('name') name?: string,
               @Query('deptId')deptId?: string) {
        return this.userService.list(pageVo, name, deptId)
    }

    @Post('/add/:deptId')
    async createUser(@Body()user: User, @Param('deptId') deptId: string) {
        const data = await this.userService.createWithDept(user, deptId)
        return ResponseUtil.success(data)
    }

    @Get('/updateAssociation/:userId/:newDeptId')
    @ApiOperation({description: '移动目标user到新的部门，可以用于没有dept关联的user加入到新的dept'})
    async update(@Param('userId') userId: string, @Param('newDeptId') newDeptId: string) {
        await this.userService.updateAssociation(userId, newDeptId)
        return ResponseUtil.success()
    }

    @Get('/bulkAddAssociation')
    async bulkAddAssociation(@Query('userIds') userIds: string,
                             @Query('targetDeptId') targetDeptId: string) {
        await this.userService.bulkAddAssociation(userIds,targetDeptId)
        return ResponseUtil.success()
    }

    @Get('/delete/:userId')
    @ApiOperation({description: '删除关系 不删除用户 删除用户使用/user/delete/:id'})
    async delete(@Param('userId')userId: string) {
        const data = await this.userService.deleteAssociation(userId)
        return ResponseUtil.success(data)
    }

    @Get('/bulkDelete')
    @ApiOperation({description: 'ids 使用‘,’分割删除该用户列表的部门关联'})
    async bulkDelete(@Query('ids') userIds: string) {
        await this.userService.bulkDeleteAssociation(userIds)
        return ResponseUtil.success()
    }

}
