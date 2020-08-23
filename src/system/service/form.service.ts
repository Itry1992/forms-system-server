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
import {FormWriteableDto} from "../dto/form.writeable.dto";
import User from "../../entity/User.entity";
import FormTodo from "../../entity/form.todo.entity";
import ProcedureNode from "../../entity/procedure.node.entity";
import Role from "../../entity/Role.entity";
import {analyzeScope} from "@typescript-eslint/parser/dist/analyze-scope";
import {ExportPdfDto} from "../dto/export.pdf.dto";
import FormData from "../../entity/form.data.entity";
import {PdfService} from "./pdf.service";
import {FormDataQueryDto} from "../dto/form.data.query.dto";
import {FormDataService} from "./form.data.service";

@Injectable()
export class FormService {
    constructor(private readonly procedureService: ProcedureService,
                private readonly formDataService: FormDataService,
                private readonly pdfService: PdfService) {
    }

    async list(pageQueryVo: PageQueryVo, name: string, deptIds: string[], roles: Role[]) {
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
        const todo = await FormTodo.findOne({
            where: {
                formId: id
            }
        })
        const ps = []
        //todo 不应该删除流程
        if (todo) {
            //删除代办事项
            ps.push(FormTodo.destroy({where: {formId: id}}))
            // ps.push(Procedure.destroy({where:{formId:id}}).then(()=>{
            //    return  Promise.all([
            //         ProcedureNode.destroy({where:{
            //                 procedureId:null
            //             }}),
            //         ProcedureNode.destroy({where:{
            //                 procedureId:null
            //             }}),
            //     ])
            // }))
            ps.push(Procedure.update({status: '2'}, {where: {formId: id}}))
        }
        ps.push(Form.update(form, {
            where: {id}
        }))
        return Form.sequelize.transaction(t => {
            return Promise.all(ps)
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
            //流程节点使用 初始节点
            const procedure: Procedure = await this.procedureService.detailByFormId(form.id, true)
            //item filter
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

    async updateWriteAble(formWriteableDto: FormWriteableDto, id: string) {
        const updateData: any = {}
        if (formWriteableDto.users)
            updateData.writeAbleUserId = formWriteableDto.users.map((u) => {
                return u.id
            })
        if (formWriteableDto.depts)
            updateData.writeAbleDeptId = formWriteableDto.depts.map((d) => {
                return d.id
            })
        if (formWriteableDto.roles)
            updateData.writeAbleRoleId = formWriteableDto.roles.map((d) => {
                return d.id
            })
        if (formWriteableDto.publicUrl)
            updateData.publicUrl = formWriteableDto.publicUrl
        return Form.update(updateData, {
            where: {id}
        })
    }

    async writeAbleList(user: User, name: string, pageQueryVo: PageQueryVo) {
        const whereOpt: any = {}
        if (name)
            whereOpt.name = {[Op.like]: `%${name}%`}
        if (user.depts && user.depts.length !== 0) {
            whereOpt[Op.or] = {
                writeAbleUserId: {[Op.contains]: [user.id]},
                writeAbleDeptId: {[Op.contains]: [user.depts[0].id]},
                // [Op.]
                writeAbleRoleId: {[Op.overlap]: user.roles.map((r) => r.id)},
            }
        } else {
            whereOpt[Op.or] = {
                writeAbleUserId: {[Op.contains]: [user.id]},
                writeAbleRoleId: {[Op.overlap]: user.roles.map((r) => r.id)},
            }
        }

        return Form.findAndCountAll({
            where: whereOpt,
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset(),
            attributes: ['id', 'name', 'createdAt'],
            include: [{
                model: Dept,
                attributes: ['id', 'name']
            }]
        })
    }

    async exportAssetsPdf(formId: string, dto: ExportPdfDto) {
        if (!dto.itemIds) {
            throw new BadRequestException('itemIds is need')
        }
        if (!dto.size) {
            dto.size = 100
        }
        if (!dto.page) {
            dto.page = 0
        }

        const formP = Form.findByPk(formId)

        if (!dto?.formDataQueryDto?.status) {
            if (dto.formDataQueryDto) {
                dto.formDataQueryDto.status = 'import,end'
            } else {
                dto.formDataQueryDto = {status: "import,end"} as FormDataQueryDto
            }
        }

        const data = await this.formDataService.list(new PageQueryVo(dto.size, dto.page), formId, dto.formDataQueryDto, true)
        const form: Form = await formP
        if (!form)
            throw new BadRequestException('error id')
        const itmes = form.items.filter((i) => dto.itemIds.includes(i.id))
        return this.pdfService.genAssetPdf(form, itmes, data, dto.baseUrl)
    }

}
