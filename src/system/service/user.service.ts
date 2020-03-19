import {Injectable} from "@nestjs/common";
import {PageQueryVo} from "../../common/pageQuery.vo";
import User from "../../entity/User.entity";
import {Op} from "sequelize";

@Injectable()
export class UserService {

    list(pageVo: PageQueryVo, name?: string) {
        const whereOpt : any = {}
        if (name)
            whereOpt.name= {[Op.like]:`%${name}%`}
        return User.findAndCountAll({
            where:whereOpt,
            limit:pageVo.getSize(),
            offset:pageVo.offset()
        });
    }
}
