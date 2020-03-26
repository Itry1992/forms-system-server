import {Injectable} from "@nestjs/common";
import {PageQueryVo} from "../../common/pageQuery.vo";
import Dict from "../../entity/dict.entity";
import {Op} from "sequelize";
import User from "../../entity/User.entity";
import {ResponseUtil} from "../../common/response.util";
import DictDetail from "../../entity/dictDetail.entity";
import {identity} from "rxjs";

@Injectable()
export class DictService {

    list(pageQueryVo: PageQueryVo, name: string) {
        const whereOpt: any = {}
        if (name) {
            whereOpt.name = {[Op.like]: `%${name}%`}
        }
        return Dict.findAndCountAll({
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset(),
            where: whereOpt,
            include: [{
                model: DictDetail
            }]
        }).then(res => {
            return ResponseUtil.page(res)
        });
    }

    create(data: Dict) {
        return Dict.create(data).then(res => {
            return ResponseUtil.success(res)
        });
    }

    update(data: Dict) {
        return Dict.update(data, {
            where: {id: data.id}
        }).then(res => {
            return ResponseUtil.success(res)
        });
    }

    delete(id: string) {
        return Dict.destroy({
            where: {
                id
            }
        }).then(res => {
            return ResponseUtil.success(res)
        });
    }

    listDetails(dictId: string) {
        return DictDetail.findAll({
            where: {
                dictId
            }
            ,order:[['value', 'ASC']]
        }).then(res => {
            return ResponseUtil.success(res)
        });
    }

    createDetails(data: DictDetail) {
        return DictDetail.create(data).then(res => {
            return ResponseUtil.success(res)
        })
    }

    updateDetails(data: DictDetail) {
        return DictDetail.update(data, {
            where: {id: data.id}
        }).then(res => {
            return ResponseUtil.success(res)
        })
    }

    deleteDetails(id: string) {
        return DictDetail.destroy({
            where: {
                id
            }
        }).then(res => {
            return ResponseUtil.success(res)
        });
    }
}
