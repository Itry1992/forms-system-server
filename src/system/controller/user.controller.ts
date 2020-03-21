import {Body, Controller, Delete, Get, Param, Post, Query, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {UserService} from "../service/user.service";
import User from "../../entity/User.entity";
import {ResponseUtil} from "../../common/response.util";
import {TestGuard} from "../../auth/test.guard";
import {DeptTreeDto} from "../dto/dept.tree.dto";
import Dept from "../../entity/Dept.entity";

@ApiTags('user')
@Controller('/user')
export class UserController {
    constructor(private readonly userService: UserService) {
    }

    @Get('/list')
    // @UseGuards(TestGuard)
    // @ApiBearerAuth()
    async list(@Query(PageVoPipe) pageVo: PageQueryVo, @Query('name') name?: string) {
        return this.userService.list(pageVo, name)
    }

    @Get('/all')
    async all() {
        const  data = await this.userService.all()
        return ResponseUtil.success(data)
    }

    @Post('/add')
    async add(@Body()user: User) {
        return this.userService.create(user)
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


}
