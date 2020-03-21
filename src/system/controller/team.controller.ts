import {Body, Controller, Get, Post, Query} from "@nestjs/common";
import {ApiOperation, ApiTags} from "@nestjs/swagger";
import {TeamService} from "../service/team.service";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {ResponseUtil} from "../../common/response.util";
import Team from "../../entity/team.entity";

// @ApiTags('team')
// @Controller('/team')
export class TeamController {
    constructor(private readonly teamService: TeamService) {
    }

    @Get('/list')
    @ApiOperation({description: '返回值中含有该team的拥有者'})
    async list(@Query(PageVoPipe) pageQueryVo: PageQueryVo) {
        const data = await this.teamService.list(pageQueryVo)
        return ResponseUtil.page(data)
    }

    @Post('/update')
    @ApiOperation({description: '该接口不支持修改成员和拥有者'})
    async update(@Body() team:Team) {
        if (team.id){
            const  data = await  this.teamService.update(team)
            return  ResponseUtil.success(data)
        }else
            return ResponseUtil.noId()
    }

    // @Post
}
