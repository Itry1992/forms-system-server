import {BadRequestException, Injectable} from "@nestjs/common";
import {Op} from "sequelize";
import Form from "../../entity/form.entity";
import Team from "../../entity/team.entity";
import Dept from "../../entity/Dept.entity";
import {Includeable} from "sequelize/types/lib/model";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {FormCreateDto} from "../dto/form.create.dto";
import Procedure from "../../entity/procedure.entity";
import {ProcedureService} from "./procedure.service";

@Injectable()
export class FormService {
    constructor(private readonly procedureService: ProcedureService) {
    }

    async list(pageQueryVo: PageQueryVo, name?: string, deptIds?: string[]) {
        const whereOptions: any = {}
        const include: Includeable[] = []
        if (name)
            whereOptions.name = {[Op.like]: `%${name}%`}
        if (deptIds && deptIds.length !== 0)
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

    async toSubmit(form: Form, nodeId?: string) {
        if (form.type === 'flow') {
            const procedure: Procedure = await this.procedureService.detailByFormId(form.id)
            if (procedure && procedure.nodes) {
                const targetNode = procedure.nodes.find((node) => {
                    if (!nodeId)
                        //如果为传递nodeid  node = start
                        return node.clazz === 'start'
                    return node.id === nodeId
                })
                if (!targetNode)
                    throw new BadRequestException('找不到初始节点，请联系表单管理人员')
                const letter = targetNode.letter
                const visibleItem = form.items.filter((i) => {
                    const find = letter.find((s) => {
                        return s === `${i.id}:visible` || s === `${i.id}:editable`
                    })
                    return !!find
                }).map((item) => {
                    item.visible = true
                    item.enable = !!letter.find(s => {
                        return s === `${item.id}:editable`
                    })
                    return item
                })
                const briefItems = targetNode.letter.filter((s) => {
                    return s.includes(':brief')
                }).map((s) => {
                    return form.items.find((i) => {
                        return i.id === s.replace(':brief', '')
                    })
                })
                return {form, items: visibleItem, briefItems, node: targetNode}
            } else {
                throw new BadRequestException('找不到流程节点，请完善流程')
            }

        } else {
            const items = form.items.filter((item) => {
                return item.visible || item.enable
            })
            return {form, items}
        }

    }
}
