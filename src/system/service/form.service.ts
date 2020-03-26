import {Injectable} from "@nestjs/common";
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

    async toSubmit(id: string,nodeId?: string) {
        const form: Form = await Form.findByPk(id)
        if (form.type === 'flow') {
            const procedure: Procedure = await this.procedureService.detailByFormId(form.id)
            if (procedure && procedure.nodes) {
                const startNode = procedure.nodes.find((node) => {
                    if (!nodeId)
                        return node.clazz === 'start'
                    return node.id === nodeId
                })
                const visibleItem = startNode.letter.filter((s) => {
                    return  s.includes('visible')
                }).map((s) => {
                    const item = form.items.find((item) => {
                        return item.id === s.replace(':visible', '')
                    })
                    item.visible =  true
                    //editAble =>
                    const findEditable = startNode.letter.find((s)=>{
                        return s === item.id+':editable'
                    })
                    item.enable = !!findEditable
                    return item
                })

                const  briefItems = startNode.letter.filter((s)=>{
                    return s.includes(':brief')
                }).map((s) =>{
                    return form.items.find((i) =>{
                        return i.id === s.replace(':brief','')
                    } )
                })

                return {items:visibleItem,briefItems}



            }

        } else {
            const  items = form.items.filter((item) => {
                return item.visible || item.enable
            })
            return  {items}
        }

    }
}
