import {BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import {UserService} from "../service/user.service";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {DeptService} from "../service/dept.service";
import User from "../../entity/User.entity";
import {ResponseUtil} from "../../common/response.util";
import {JwtAuthGuard} from "../../auth/auth.guard";
import {UserCreateDto} from "../dto/user.create.dto";
import Dept from "../../entity/Dept.entity";
import {AdminGuard} from "../../auth/admin.guard";

@Controller('/user/dept')
@ApiTags('用户和部门关系维护')
export class UserDeptController {
    constructor(private readonly userService: UserService,
                private readonly deptService: DeptService) {
    }

    @Get('/list')
    @ApiOperation({description: '当前部门下的人员（不包含子部门） ， 如果 不传递deptId, 则为当前token负载中的人员'})
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async list(@Req() req, @Query(PageVoPipe) pageVo: PageQueryVo, @Query('name') name?: string,
               @Query('deptId')deptId?: string) {
        if (!deptId) {
            if (req.user.depts && req.user.depts[0]) {
                deptId = req.user.depts[0].id
            } else
                throw  new BadRequestException('当前用户没有部门')
        }

        return this.userService.list(pageVo, name, deptId)
    }

    @Get('/userWhitRoot')
    @ApiBearerAuth()
    @ApiOperation({description: '当前用户所在树下的顶级节点下的全部人员'})
    @UseGuards(JwtAuthGuard)
    async getRoot(@Req() req,@Query(PageVoPipe) pageQueryVo: PageQueryVo) {
        const user: User = req.user
        if (user.sysRoleId ==='1') {
            //admin 返回全部数据
            const page = await User.findAndCountAll({
                attributes: {exclude: ['pwd']},
                limit:pageQueryVo.getSize(),
                offset:pageQueryVo.offset()
            })

            return  ResponseUtil.page(page)
        }
        if (!user.rootDeptId) {
            throw new BadRequestException('老数据无法使用~')
        }
        const page = await User.findAndCountAll({
            where: {
                rootDeptId: user.rootDeptId
            },
            attributes: {exclude: ['pwd']},
            limit:pageQueryVo.getSize(),
            offset:pageQueryVo.offset()
        })

        return  ResponseUtil.page(page)
    }

    @Post('/add/:deptId')
    async createUser(@Body()user: User, @Param('deptId') deptId: string) {
        const data = await this.userService.createWithDept(user, deptId)
        return ResponseUtil.success(data)
    }

    @Get('/updateAssociation/:userId/:newDeptId')
    @ApiOperation({description: '移动目标user到新的部门，可以用于没有dept关联的user加入到新的dept'})
    async update(@Param('userId') userId: string, @Param('newDeptId') newDeptId: string) {
        //

        const  dept = await Dept.findByPk(newDeptId)
        const  root = await this.deptService.findRoot(dept)

        await this.userService.updateAssociation(userId, newDeptId,root.id)
        return ResponseUtil.success()
    }

    @Get('/bulkAddAssociation')
    @UseGuards(JwtAuthGuard,AdminGuard)
    async bulkAddAssociation(@Query('userIds') userIds: string,
                             @Query('targetDeptId') targetDeptId: string) {
        //only
        const  dept = await Dept.findByPk(targetDeptId)
        const  root = await this.deptService.findRoot(dept)

        await this.userService.bulkAddAssociation(userIds, targetDeptId,root.id)
        return ResponseUtil.success()
    }

    @Get('/delete/:userId')
    @UseGuards(JwtAuthGuard,AdminGuard)
    @ApiOperation({description: '删除关系 不删除用户 删除用户使用/user/delete/:id 被删除的用户将会自动的归属到顶级部门'})
    async delete(@Param('userId')userId: string) {
        const data = await this.userService.bulkDeleteAssociation(userId)
        return ResponseUtil.success(data)
    }

    @Get('/bulkDelete')
    @UseGuards(JwtAuthGuard,AdminGuard)
    @ApiOperation({description: 'ids 使用‘,’分割删除该用户列表的部门关联  被删除的用户将会自动的归属到顶级部门'})
    async bulkDelete(@Query('ids') userIds: string) {
        await this.userService.bulkDeleteAssociation(userIds)
        return ResponseUtil.success()
    }


    @Post('/createWithDept')
    @ApiOperation({description: '创建用户 同时指定部门 和是否是部门管理人员'})
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async createByDept(@Req() req, @Body() userCreateDto: UserCreateDto) {
        let rootDept
        const user: User = req.user
        if (userCreateDto.isDeptAdmin === true) {
            if (user.sysRoleId !== '1')
                throw new BadRequestException('只有 systemAdmin 可以创建 DeptAdmin')
        } else {
            if (user.sysRoleId !== '2' && user.sysRoleId !== '1') {
                throw new BadRequestException('需要 systemAdmin 或者 deptAdmin 角色')
            }
        }
        if (userCreateDto.deptId) {
            if (userCreateDto.isDeptAdmin) {
                //检查 dpetId is root
                const dept = await Dept.findByPk(userCreateDto.deptId)
                if (dept.parentId === '0') {
                    rootDept = dept
                } else {
                    throw new BadRequestException('需要root节点')
                }
            } else {
                const dept = await Dept.findByPk(userCreateDto.deptId)
                rootDept = await this.deptService.findRoot(dept)
            }
        } else
            throw new BadRequestException('need deptId ')


        const data = await this.deptService.createWithDept(userCreateDto, rootDept)
        return  ResponseUtil.success(data)
    }

}
