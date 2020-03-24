import {Injectable} from "@nestjs/common";
import Procedure from "../../entity/procedure.entity";
import ProcedureNode from "../../entity/procedure.node.entity";

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

    async update(procedure: Procedure) {
        return Procedure.update(procedure, {
            where: {
                id: procedure.id
            }
        });
    }

    async delete(id: string) {
        return Procedure.destroy({
            where: {id}
        });
    }

    async detail(id: string, isFormId: boolean) {
        if (isFormId && isFormId === true)
            return Procedure.findOne({
                where: {
                    formId: id,
                    status: '2'
                },
                include: [{
                    model: ProcedureNode
                }]
            })
        else
            return Procedure.findByPk(id, {
                include: [{
                    model: ProcedureNode
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
}
