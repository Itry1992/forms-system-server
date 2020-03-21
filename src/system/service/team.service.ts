import {Injectable} from "@nestjs/common";
import Team from "../../entity/team.entity";
import {PageQueryVo} from "../../common/pageQuery.vo";
import User from "../../entity/User.entity";

@Injectable()
export class TeamService {

    async findByOwnerId(id: string) {
        return Team.findOne({
            where: {
                ownerId: id
            }
        });
    }

    async list(pageQueryVo: PageQueryVo) {
        return Team.findAndCountAll({
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset(),
            include: [{
                association: 'member',
                through: {
                    where: {
                        typeof: 'owner'
                    }
                },
            }]
        })
    }

    async update(team: Team) {
       return  Team.update(team,{
            where:{id:team.id}
        })
    }
}
