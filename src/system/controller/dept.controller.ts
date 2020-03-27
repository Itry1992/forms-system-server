import {Body, Controller, Get, Param, Post, Query, Req, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import {DeptService} from "../service/dept.service";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {ResponseUtil} from "../../common/response.util";
import Dept from "../../entity/Dept.entity";
import {JwtAuthGuard} from "../../auth/auth.guard";
import {DeptTreeDto} from "../dto/dept.tree.dto";


@ApiTags('/dept')
@Controller('/dept')
export class DeptController {
    constructor(private readonly deptService: DeptService) {
    }

    @Get('/list')
    @ApiOperation({description: 'isParent 为true时只返回一级节点 false/null返全部节点'})
    async listAll(@Query(PageVoPipe) pageQueryVo: PageQueryVo,
                  @Query('name') name?: string, @Query('isParent')isParent?: boolean) {
        // console.log(isParent)
        // isParent =
        return ResponseUtil.page(await this.deptService.list(pageQueryVo, name, isParent))
    }

    @Get('/list/deptTree')
    @ApiOperation({description: 'name 仅对一级节点生效'})
    async listTree(@Query('name') name?: string) {
        const data = await this.deptService.listTree( null,name)
        return ResponseUtil.page(data)
    }

    @Post('/addDept')
    @ApiOperation({description: '新增部门'})
    async add(@Body()dept: Dept) {
        // dept.id = null
        delete dept.id
        const data = await this.deptService.create(dept)
        return ResponseUtil.success(data)
    }

    @Post('/update')
    async update(@Body()dept: Dept) {
        if (dept.id) {
            const data = await this.deptService.update(dept)
            return ResponseUtil.success(data)
        } else
            return ResponseUtil.noId()
    }

    @Get('/delete/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async delete(@Param('id')id: string,@Req() req) {
        const data = await this.deptService.delete(id,req);
        return ResponseUtil.success(data+'')
    }

    @Get('/treeByUser')
    @ApiOperation({description: '返回指定用户所在的部门和其 children, 如果未指定则为当前token负载中的user'})
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async treeByUser(@Query('userId')userId: string, @Req() req) {
        if (!userId)
            userId = req.user.id
        const dept = await this.deptService.findByUserId(userId)
        const tree = this.deptService.findNext(DeptTreeDto.byDept(dept))
        return ResponseUtil.success(tree)
    }

    // @Get('/')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({description:'当前用户所在部门树'})
    async allTreeByUser() {
        //todo...
    }


}
