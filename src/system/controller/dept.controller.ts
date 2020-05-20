import {BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import {DeptService} from "../service/dept.service";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {ResponseUtil} from "../../common/response.util";
import Dept from "../../entity/Dept.entity";
import {JwtAuthGuard} from "../../auth/auth.guard";
import {DeptTreeDto} from "../dto/dept.tree.dto";
import {XlsxService} from "../service/xlsx.service";


@ApiTags('/dept')
@Controller('/dept')
export class DeptController {
    constructor(private readonly deptService: DeptService,
                private readonly xlsxService: XlsxService) {
    }

    @Get('/list')
    @ApiOperation({description: ' 所有节点 isParent 为true时只返回一级节点 false/null返全部节点'})
    async listAll(@Query(PageVoPipe) pageQueryVo: PageQueryVo,
                  @Query('name') name?: string, @Query('isParent')isParent?: boolean) {
        return ResponseUtil.page(await this.deptService.list(pageQueryVo, name, isParent))
    }

    @Get('/list/deptTree')
    @ApiOperation({description: ' 所有节点 name 仅对一级节点生效'})
    async listTree(@Query('name') name?: string) {
        const data = await this.deptService.listTree(null, name)
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
    @ApiOperation({description: '不支持调整层级关系'})
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
    async delete(@Param('id')id: string, @Req() req) {
        const data = await this.deptService.delete(id, req);
        return ResponseUtil.success(data + '')
    }

    @Get('/treeByUser')
    @ApiOperation({description: '返回指定用户所在的顶级部门和其 children, 如果未指定则为当前token负载中的user'})
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async treeByUser(@Query('userId')userId: string, @Req() req) {
        if (!userId)
            userId = req.user.id

        const dept = await this.deptService.findByUserId(userId)
        let rootId = dept.rootId
        if (!dept.rootId || dept.rootId==='0')
            rootId = dept.id
        const tree = this.deptService.findNext(rootId)
        return ResponseUtil.success(tree)
    }

    @Get('/usersTree')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({description: '当前用户所在部门树 admin 返回全部的树'})
    async allTreeByUser(@Req() req) {
        if(req.user.sysRoleId === '1') {
            return  this.listTree()
        }
        const dept: Dept = req.user.depts[0]
        if (!dept)
            throw new BadRequestException('当前用户没有所在部门')
        let root
        if (req.user.rootDeptId) {
            root = await Dept.findByPk(req.user.rootDeptId)
        } else
            root = await this.deptService.findRoot(dept)
        //
        if (!root)
            throw new BadRequestException('no root')
        let rootId = dept.rootId
        if (!dept.rootId || dept.rootId==='0')
            rootId = dept.id
        const tree = await this.deptService.findNext(rootId)
        return {success: true, data: [tree]}
    }

}
