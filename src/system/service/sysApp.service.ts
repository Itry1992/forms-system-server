import {Injectable} from "@nestjs/common";
import {PageQueryVo} from "../../common/pageQuery.vo";
import App from "../../entity/App.entity";
import {Op, where} from "sequelize";
import User from "../../entity/User.entity";
import {ResponseUtil} from "../../common/response.util";
import {AppUpdateDto} from "../dto/app.update.dto";
import Team from "../../entity/team.entity";

@Injectable()
export class SysAppService {

    list(pageQueryVo: PageQueryVo, appName?: string, userId?: string) {
        const whereOptions: any = {}
        const teamOptions: any = {}
        if (appName) {
            whereOptions.name = {[Op.like]: `%${appName}%`}
        }
        if (userId) {
            teamOptions.userId = userId
        }
        return App.findAndCountAll({
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset(),
            include: [{
                model: Team,
                where: teamOptions
            }]
        }).then((res) => {
            return ResponseUtil.page(res)
        })
    }

    create(app: App) {
        return App.create(app).then((res) => {
            return ResponseUtil.success(res)
        });
    }

    update(appUpdateDto: AppUpdateDto, id: string) {
        return App.update(appUpdateDto, {
            where: {id}
        }).then(res => {
            return ResponseUtil.success(res)
        });
    }

    delete(id: string) {
        return App.destroy({where: {id}}).then(res => {
            return ResponseUtil.success(res)
        });
    }
}
