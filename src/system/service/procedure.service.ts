import {Injectable} from "@nestjs/common";
import Procedure from "../../entity/procedure.entity";
import ProcedureNode from "../../entity/procedure.node.entity";
import ProcedureEdge from "../../entity/procedure.edge.entity";
import {ifError} from "assert";
import {ResponseUtil} from "../../common/response.util";

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

    async detailByFormId(id: string) {
        return Procedure.findOne({
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
