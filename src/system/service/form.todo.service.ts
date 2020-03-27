import {Injectable} from "@nestjs/common";
import FormTodo from "../../entity/form.todo.entity";
import User from "../../entity/User.entity";
import {Op} from "sequelize";
import {PageQueryVo} from "../../common/pageQuery.vo";
import ProcedureEdge from "../../entity/procedure.edge.entity";

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
                status:'1',
                ...userOpt
            },
            include: [{
                model: ProcedureEdge
            }]
        })
    }

    async findByUser(user: User, pageQueryVo: PageQueryVo, status: string , type: string, currentUserDeal?: boolean) {
        const userOpt = this.getUserOpt(user)
        const statusOpt: any = {}
        if (status === '1')
            statusOpt.status = '1'
        if (status === '2') {
            statusOpt.status = '2'
        }
        if (currentUserDeal===true && user) {
            statusOpt.status = '2'
            statusOpt.dealUserId = user.id
        }
        return FormTodo.findAndCountAll({
            where: {
                type:type,
                ...userOpt,
                ...statusOpt
            },
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset(),
            order:[['createdAt','DESC']]
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
}
