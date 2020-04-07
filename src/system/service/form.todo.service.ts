import {BadRequestException, Injectable} from "@nestjs/common";
import FormTodo from "../../entity/form.todo.entity";
import User from "../../entity/User.entity";
import {Op} from "sequelize";
import {Sequelize} from 'sequelize-typescript';
import {PageQueryVo} from "../../common/pageQuery.vo";
import ProcedureEdge from "../../entity/procedure.edge.entity";
import FormData from "../../entity/form.data.entity";
import Form from "../../entity/form.entity";

@Injectable()
export class FormTodoService {
    async create(formTodo: FormTodo) {
        return FormTodo.create(formTodo)
    }

    async bulkCreate(toDo: any[]) {
        return FormTodo.bulkCreate(toDo)
    }

    async findByUserAndFormData(user: User, formId: string, dataGroup: string) {
        const userOpt = this.getUserOpt(user)
        return FormTodo.findOne({
            where: {
                formId,
                formDataGroup: dataGroup,
                status: '1',
                ...userOpt
            },
            include: [{
                model: ProcedureEdge
            }]
        })
    }

    async findByUser(user: User, pageQueryVo: PageQueryVo, status: string, type: string, currentUserDeal?: boolean, formId?: string) {
        const userOpt = this.getUserOpt(user)
        const statusOpt: any = {}
        if (status === '1')
            statusOpt.status = '1'
        if (status === '2') {
            statusOpt.status = '2'
        }
        if (currentUserDeal === true) {
            statusOpt.status = '2'
            statusOpt.dealUserId = user.id
        }
        if (formId) {
            statusOpt.formId = formId
        }
        return FormTodo.findAndCountAll({
            where: {
                type: type,
                ...userOpt,
                ...statusOpt
            },
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset(),
            order: [['createdAt', 'DESC']]
        })
    }

    private getUserOpt(user: User) {
        const userOpt: any = {}
        if (user.depts && user.depts.length !== 0) {
            userOpt[Op.or] = {
                targetUserId: {[Op.contains]: [user.id]},
                targetDeptId: {[Op.contains]: [user.depts[0].id]},
            }
        } else {
            userOpt.targetUserId = {[Op.contains]: [user.id]}
        }

        return userOpt
    }

    findByPK(todoId: string) {
        return FormTodo.findByPk(todoId, {
            include: [{
                model: ProcedureEdge
            }]
        })
    }

    async listAll(pageQueryVo: PageQueryVo, userId: string, deptId: string) {
        const whereOpt: any = {}
        if (userId) {
            whereOpt.targetUserId = {
                [Op.contains]: [userId]
            }
        }
        if (deptId) {
            whereOpt.targetDeptId = {
                [Op.contains]: [deptId]
            }
        }
        return FormTodo.findAndCountAll({
            where: whereOpt,
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset()
        });
    }

    async createByUser(user: User, pageQueryVo: PageQueryVo) {
        return FormTodo.findAndCountAll({
            where: {
                createUserId: user.id
            },
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset(),
            order: [['createdAt', 'DESC']]
        });
    }

    async getGroup(todoId: string, formDataId: string) {
        let formId = ''
        let formDataGroup = ''
        if (todoId) {
            const todo: FormTodo = await FormTodo.findByPk(todoId)
            if (todo) {
                formId = todo.formId
                formDataGroup = todo.formDataGroup
                return {formId, formDataGroup}
            }
        }
        if (formDataId) {
            const formData = await FormData.findByPk(formDataId, {
                attributes: ['formId', 'dataGroup']
            })
            if (formData) {
                formId = formData.formId
                formDataGroup = formData.dataGroup
                return {formId, formDataGroup}
            }
        }

        throw new BadRequestException('需要正确的 todoId 或者 formId' + todoId + formId)
    }

    async groupByForm(user: User, status: string, type: string, dealByUser: boolean) {
        const statusOpt: any = {}
        if (status === '1')
            statusOpt.status = '1'
        if (status === '2') {
            statusOpt.status = '2'
        }
        if (dealByUser === true) {
            statusOpt.status = '2'
            statusOpt.dealUserId = user.id
        }
        const userOpt = this.getUserOpt(user)
        return FormTodo.findAll({
            attributes: ['formId', [Sequelize.fn('COUNT', Sequelize.col('FormTodo.id')), 'formCount']],
            include: [{model: Form, attributes: ['id', 'name'], required: true}],
            group: [Sequelize.col('form_id'), Sequelize.col('form.id'), Sequelize.col('form.name'),],
            where: {
                // status: '1',
                ...userOpt,
                ...statusOpt,
                type
            },
        })
    }
}
