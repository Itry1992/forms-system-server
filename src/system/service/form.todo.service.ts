import {BadRequestException, Injectable} from "@nestjs/common";
import FormTodo from "../../entity/form.todo.entity";
import User from "../../entity/User.entity";
import {Op} from "sequelize";
import {Sequelize} from 'sequelize-typescript';
import {PageQueryVo} from "../../common/pageQuery.vo";
import ProcedureEdge from "../../entity/procedure.edge.entity";
import FormData from "../../entity/form.data.entity";
import Form from "../../entity/form.entity";
import {TimeUtil} from "../../common/util/time.util";

@Injectable()
export class FormTodoService {
    async create(formTodo: FormTodo) {
        return FormTodo.create(formTodo)
    }

    async bulkCreate(toDo: any[]) {
        return FormTodo.bulkCreate(toDo)
    }

    async findByUserAndFormData(user: User, formId: string, dataGroup: string) {
        const userOpt = this.getOrOpts(user)
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
        // if (user.signTime.valueOf()>)
        const signed = TimeUtil.signed(user.signTime)
        const orOpts = this.getOrOpts(user)
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
        if (!signed) {
            //如果没签到 只能查看不需要签到 代办事项
            statusOpt.onlySigned = false
        }

        return FormTodo.findAndCountAll({
            where: {
                type: type,
                [Op.or]: orOpts,
                ...statusOpt,
                [Op.and]: Sequelize.literal(`(submitter_id is null or submitter_id @> array['${user.id}']::varchar[] is false)`)
            },
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset(),
            order: [['createdAt', 'DESC']]
        })
    }

    private getOrOpts(user: User) {
        const ors: any = {}
        ors.targetUserId = {[Op.contains]: [user.id]}
        if (user.depts && user.depts.length !== 0) {
            ors.targetDeptId = {[Op.contains]: [user.depts[0].id]}
            ors.targetDeptIdWhitRole = {[Op.overlap]: user.roles.map((r) => user.depts[0].id + ':' + r.id)}
        }
        ors.targetRoleId = {[Op.overlap]: user.roles.map((r) => r.id)}

        return ors
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

        const signed = TimeUtil.signed(user.signTime)
        const statusOpt: any = {}
        if (!signed) {
            //如果没签到 只能查看不需要签到 代办事项
            statusOpt.onlySigned = false
        }
        if (status === '1')
            statusOpt.status = '1'
        if (status === '2') {
            statusOpt.status = '2'
        }
        if (dealByUser === true) {
            statusOpt.status = '2'
            statusOpt.dealUserId = user.id
        }
        const orOpts = this.getOrOpts(user)
        return FormTodo.findAll({
            attributes: ['formId', [Sequelize.fn('COUNT', Sequelize.col('FormTodo.id')), 'formCount']],
            include: [{model: Form, attributes: ['id', 'name'], required: true}],
            group: [Sequelize.col('form_id'), Sequelize.col('form.id'), Sequelize.col('form.name'),],
            where: {
                [Op.or]: orOpts,
                ...statusOpt,
                type
            },
        })
    }
}
