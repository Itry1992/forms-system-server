import {BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards} from "@nestjs/common";
import {ApiOperation, ApiTags} from "@nestjs/swagger";
import Role from "../../entity/Role.entity";
import {RoleService} from "../service/role.service";
import {ResponseUtil} from "../../common/response.util";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {JwtAuthGuard} from "../../auth/auth.guard";

@Controller('role')
@ApiTags('role')

export class RoleController {
    constructor(private readonly roleService: RoleService) {
    }

    @Post('/create')
    @UseGuards(JwtAuthGuard)
    async create(@Body() role: Role,@Req()  req) {
        if (!req.user.sysRoleId)
            throw new BadRequestException('需要管理员')
        if (!role.rootDeptId)
            throw new BadRequestException('rootDeptId is need')
        return ResponseUtil.success(await this.roleService.create(role))
    }

    @Post('/update')
    @UseGuards(JwtAuthGuard)
    async update(@Body() role: Role,@Req()  req) {
        if (!req.user.sysRoleId)
            throw new BadRequestException('需要管理员')
        return ResponseUtil.success(await this.roleService.update(role))
    }

    @Get('/delete/:id')
    @UseGuards(JwtAuthGuard)
    async delete(@Param('id') id: string,@Req()  req) {
        if (!req.user.sysRoleId)
            throw new BadRequestException('需要理员')
        return ResponseUtil.success(await this.roleService.delete(id))
    }

    @Get('/list')
    @UseGuards(JwtAuthGuard)
    async list(@Query('rootDeptId') rootDeptId: string,@Query('noBuildTree')noBuildTree: string, @Req() req) {
        if (!rootDeptId)
            rootDeptId = req.user.rootDeptId
        return ResponseUtil.success(await this.roleService.list(rootDeptId, noBuildTree))
    }

    @Get('/childrenList')
    async childrenList(@Query('rootDeptId') rootDeptId: string,@Query('parentId') parentId: string) {
        return ResponseUtil.success(await this.roleService.childrenList(rootDeptId , parentId))
    }

    @Get('addUserTo/:roleId/:userIds')
    @ApiOperation({description:'把用户添加到角色'})
    @UseGuards(JwtAuthGuard)
    async updateAssociation(@Param('userIds') userIds: string, @Param('roleId')roleId: string) {
        return ResponseUtil.success(await this.roleService.updateAssociation(userIds,roleId))
    }
    @Get('/listUser/:roleId')
    @UseGuards(JwtAuthGuard)
    async listUser(@Param('roleId') roleId: string , @Query(PageVoPipe) pageQueryVo:PageQueryVo) {
        return ResponseUtil.page(await this.roleService.listUser(roleId,pageQueryVo))
    }
    @Get('delete/:roleId/:userIds')
    @UseGuards(JwtAuthGuard)
    async deleteAssociation(@Param('roleId')roleId: string,@Param('userIds') userIds: string) {
        return  ResponseUtil.success(await this.roleService.deleteAssociation(roleId,userIds))
    }
}
