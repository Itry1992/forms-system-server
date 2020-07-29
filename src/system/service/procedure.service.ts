import {Injectable} from "@nestjs/common";
import Procedure from "../../entity/procedure.entity";
import ProcedureNode from "../../entity/procedure.node.entity";
import ProcedureEdge from "../../entity/procedure.edge.entity";
import {ifError} from "assert";
import {ResponseUtil} from "../../common/response.util";
import {Producer} from "@nestjs/common/interfaces/external/kafka-options.interface";
import Dept from "../../entity/Dept.entity";
import {Op} from "sequelize";
import Role from "../../entity/Role.entity";
import User from "../../entity/User.entity";
import {ArrayUtil} from "../../common/util/array.util";

@Injectable()
export class ProcedureService {

    async getAll(formId: string) {
        return Procedure.findAll({
            where: {
                formId
            }
        });
    }

    async create(procedure: Procedure) {
        return Procedure.create(procedure);
    }

    async upsert(procedure: Procedure, formId: string) {
        const dbEntity = await this.findByFormId(formId)
        if (dbEntity)
            procedure.id = dbEntity.id
        else
            delete procedure.id
        // console.log(procedure.id)
        procedure.status = '1'
        return Procedure.sequelize.transaction(t => {
            return Procedure.upsert(procedure, {returning: true}).then((res) => {
                return Promise.all([
                    ProcedureNode.destroy({
                        where: {procedureId: res[0].id}
                    }),
                    ProcedureEdge.destroy({
                        where: {procedureId: res[0].id}
                    })
                ]).then(() => {
                    if (procedure.nodes && procedure.nodes.length !== 0) {
                        procedure.nodes.forEach((node) => {
                            node.procedureId = res[0].id
                        })
                        return ProcedureNode.bulkCreate(procedure.nodes).then(() => {
                            if (procedure.edges && procedure.edges.length !== 0) {
                                procedure.edges.forEach((e) => {
                                    e.procedureId = res[0].id
                                })
                                return ProcedureEdge.bulkCreate(procedure.edges).then(() => {
                                    return res[0]
                                })
                            }
                            return res[0]
                        })
                    }
                    return res[0]
                })

            })
        })
    }

    async deleteByFormId(formId: string) {
        return Procedure.destroy({
            where: {formId}
        });
    }

    async detailByFormId(id: string, noDetail?: boolean) {
        let p: any = await Procedure.findOne({
            where: {
                formId: id,
                // status: '2'
            },
            include: [{
                model: ProcedureNode,
            }, {
                model: ProcedureEdge
            }]
        })
        if (noDetail)
            return p
        if (p) {
            p = p.get({plain: true})
            const ids = p.nodes.reduce((per, c) => {
                if (ArrayUtil.isNotNull(c.assignDept))
                    per.depts = per.depts.concat(c.assignDept)
                if (ArrayUtil.isNotNull(c.assignPerson))
                    per.users = per.users.concat(c.assignPerson)
                if (ArrayUtil.isNotNull(c.assignRole))
                    per.roles = per.roles.concat(c.assignRole)
                if (ArrayUtil.isNotNull(c.dynamic?.submitterDeptRoles))
                    per.roles = per.roles.concat(c.dynamic.submitterDeptRoles)
                return per
            }, {roles: [], depts: [], users: []})

            await Promise.all([
                Dept.findAll({where: {id: {[Op.in]: ids.depts}}}),
                Role.findAll({where: {id: {[Op.in]: ids.roles}}}),
                User.findAll({where: {id: {[Op.in]: ids.users}}, include: [{model: Dept}]},),
            ]).then((res) => {
                p.nodes.forEach((n) => {
                    n.selectMode = []
                    if (n.dynamic?.submitter)
                        n.selectMode.push({id: '-1', name: '表单发起人', type: 'dynamicUser'})
                    if (ArrayUtil.isNotNull(n.assignDept)) {
                        n.assignDept.forEach((s) => {
                            const dept: Dept = res[0]?.find((d) => d.id === s)
                            if (dept)
                                n.selectMode.push({id: s, name: dept.name, type: 'dept'})
                        })
                    }
                    if (ArrayUtil.isNotNull(n.assignRole)) {
                        n.assignRole.forEach((s) => {
                            const find = res[1]?.find((d) => d.id === s)
                            if (find)
                                n.selectMode.push({id: s, name: find.name, type: 'role'})
                        })
                    }
                    if (ArrayUtil.isNotNull(n.assignPerson)) {
                        n.assignPerson.forEach((s) => {
                            const find: User = res[2]?.find((d) => d.id === s)
                            if (find)
                                n.selectMode.push({id: s, name: find.name, type: 'user', deptId: find.depts[0]?.id})
                        })
                    }
                    if (ArrayUtil.isNotNull(n.dynamic?.submitterDeptRoles)) {
                        n.dynamic?.submitterDeptRoles.forEach((s) => {
                            const find = res[1]?.find((d) => d.id === s)
                            if (find)
                                n.selectMode.push({id: s, name: find.name, type: 'dynamicRole'})
                        })
                    }
                })
            })
        }
        return p
    }

    async createNode(procedureNode: ProcedureNode) {
        if (procedureNode.id)
            return ProcedureNode.update(procedureNode, {
                where: {id: procedureNode.id}
            });
        else
            return ProcedureNode.create(procedureNode)
    }

    async deleteNode(id: string) {
        return ProcedureNode.destroy({
            where: {id}
        });
    }

    async findByFormId(formId: string) {
        return Procedure.findOne({
            where: {formId}
        })
    }
}
