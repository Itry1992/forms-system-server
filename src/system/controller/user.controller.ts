import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query, Req,
    UseGuards,
    UsePipes
} from "@nestjs/common";
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {UserService} from "../service/user.service";
import User from "../../entity/User.entity";
import {ResponseUtil} from "../../common/response.util";
import {RegisterDto} from "../dto/register.dto";
import Dept from "../../entity/Dept.entity";
import {RoleService} from "../service/role.service";
import {JwtAuthGuard} from "../../auth/auth.guard";
import {DeptService} from "../service/dept.service";

@ApiTags('user')
@Controller('/user')
export class UserController {
    constructor(private readonly userService: UserService,
                private readonly roleService: RoleService,
                private readonly deptService: DeptService) {
    }

    @Get('/list')
    async list(@Query(PageVoPipe) pageVo: PageQueryVo, @Query('name') name?: string) {
        return this.userService.list(pageVo, name)
    }

    @Get('/all')
    async all() {
        const data = await this.userService.all()
        return ResponseUtil.success(data)
    }

    @Post('/update')
    async update(@Body() user: User) {
        if (user.id) {
            return this.userService.update(user)
        } else
            return ResponseUtil.error('no id')
    }

    @Get('/delete/:id')
    async delete(@Param('id')id: string) {
        return this.userService.delete(id)
    }

    @Get('/toRegister/:deptId')
    async toRegister(@Param('deptId') deptId: string) {
        const dept: Dept = await Dept.findByPk(deptId)
        if (!dept)
            throw new BadRequestException('error deptId')
        const roleTree = await this.roleService.list(dept.rootId === '0' ? dept.id : dept.rootId)
        const deptTree = await this.deptService.findNext(dept.rootId === '0' ? dept.id : dept.rootId)
        return ResponseUtil.success({roleTree,deptTree})
    }

    @Post('/register')
    async register(@Body() registerDto: RegisterDto) {
        return ResponseUtil.success(await this.userService.register(registerDto, registerDto.deptId))
    }

    @Get('/sign')
    @UseGuards(JwtAuthGuard)
    async sign(@Req() req) {
        User.update({signTime: new Date()}, {where: {id: req.user.id}})
        return ResponseUtil.success()
    }


}
