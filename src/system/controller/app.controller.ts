import {ApiBasicAuth, ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import {Body, Controller, Delete, Get, Param, Post, Query, Req, UnauthorizedException, UseGuards} from "@nestjs/common";
import {PageVoPipe} from "../../common/PageVoPipe";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {SysAppService} from "../service/sysApp.service";
import {AuthGuard} from "@nestjs/passport";
import {JwtAuthGuard} from "../../auth/auth.guard";
import App from "../../entity/App.entity";
import {userInfo} from "os";
import {ResponseUtil} from "../../common/response.util";
import {AppUpdateDto} from "../dto/app.update.dto";
import {TeamService} from "../service/team.service";

@ApiTags('应用')
@Controller('/app')
export class AppController {
    constructor(private readonly appService: SysAppService,
                private readonly teamService: TeamService) {
    }

    @Get('/list')
    async list(@Query(PageVoPipe) pageQueryVo: PageQueryVo, @Query('ownerName')ownerName?: string, @Query('appName')appName?: string) {
        return this.appService.list(pageQueryVo, ownerName, appName)
    }


    @Get('/createByAdmin')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({description: '创建应用 by systemAdmin  需要有 systemAdmin角色'})
    async createApp(@Req() req, @Body() app: App) {
        const {user} = req
        if (user && user.sysRole && user.sysRole.name === 'systemAdmin') {
            return this.appService.create(app)
        } else
            throw new UnauthorizedException()
    }

    @Post('/createByUser')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async create(@Req() req, @Body() app: App) {
        if (req.user) {
            app.team.id = (await this.teamService.findByOwnerId(req.user.id)).id
            return this.appService.create(app)
        }
    }
    //
    // @Get('/listByUser')
    // @ApiBearerAuth()
    // @UseGuards(JwtAuthGuard)
    // async listByUser(@Req() req, @Query(PageVoPipe) pageQueryVo: PageQueryVo, @Query('appName')appName?: string) {
    //     if (req.user) {
    //         return this.appService.list(pageQueryVo, null, appName, req.user.id)
    //     }
    // }

    @Post('/update/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async update(@Body()appUpdateDto: AppUpdateDto, @Param('id') id: string, @Req() req) {
        if (req.user) {
            if (!req.user.sysRole || req.user.sysRole.name !== 'systemAdmin') {
                delete appUpdateDto.userId
            }
            return this.appService.update(appUpdateDto, id)
        } else
            return ResponseUtil.unAuth()
    }

    @Get('/delete/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async delete(@Param('id') id: string) {
        return this.appService.delete(id)
    }

    @Post('/copy')
    @ApiBasicAuth()
    @ApiOperation({description: '等待完善 同时拷贝表单 和流程 不拷贝表单数据'})
    @UseGuards(JwtAuthGuard)
    async copy() {
        return {success: true}
    }

}
