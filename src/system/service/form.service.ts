import {Injectable} from "@nestjs/common";
import {Op} from "sequelize";
import Form from "../../entity/form.entity";
import Team from "../../entity/team.entity";
import Dept from "../../entity/Dept.entity";
import {Includeable} from "sequelize/types/lib/model";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {FormCreateDto} from "../dto/form.create.dto";

@Injectable()
export class FormService {
    async list(pageQueryVo: PageQueryVo, name?: string, deptIds?: string[]) {
        const whereOptions: any = {}
        const include: Includeable[] = []
        if (name)
            whereOptions.name = {[Op.like]: `%${name}%`}
        if (deptIds&&deptIds.length!==0)
            include.push({
                model: Dept,
                where: {id: {[Op.in]: deptIds}},
                // order:''
            })
        return Form.findAndCountAll({
            where: whereOptions,
            include,
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset()
        })
    }

    async create(form: FormCreateDto) {
        return Form.create(form)
    }

    async update(id: string, form: Form) {
        return Form.update(form, {
            where: {id}
        })
    }

    async delete(id: string) {
        return Form.destroy({
            where: {id}
        })
    }

    async detail(id: string) {
        return Form.findByPk(id);
    }
}
