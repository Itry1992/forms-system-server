import {BadRequestException, Get, HttpException, Injectable, Param} from "@nestjs/common";
import {PageQueryVo} from "../../common/pageQuery.vo";
import FormData from "../../entity/form.data.entity";
import Form from "../../entity/form.entity";
import {ResponseUtil} from "../../common/response.util";
import {ProcedureService} from "./procedure.service";
import * as uuid from 'node-uuid';
import Procedure from "../../entity/procedure.entity";
import {FormTodoService} from "./form.todo.service";
import FormTodo from "../../entity/form.todo.entity";
import ProcedureEdge from "../../entity/procedure.edge.entity";
import User from "../../entity/User.entity";
import {where} from "sequelize";


@Injectable()
export class FormDataService {
    constructor(private readonly procedureService: ProcedureService,
                private readonly formTodoService: FormTodoService) {
    }

    async list(pageQueryVo: PageQueryVo, formId: string) {
        return FormData.findAndCountAll({
            where: {formId},
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset()
        })
    }

    async add(data: any, formId: string, ip: string) {
        //流程

        return FormData.create({data, formId, submitIp: ip, endData: true})
    }

    async update(data: any, id: string) {
        return FormData.update({data}, {
            where: {id}
        })
    }

    // async find

    async submit(data: FormData, formId: string, ip?: string, user?: User) {
        //第一次提交时候 自动赋予start
        //获取表单
        const form = await Form.findByPk(formId)
        if (!form) {
            return ResponseUtil.error('该表单已经被删除')
        }
        if (form.type === 'flow') {
            const logData: any = {}
            //流程表单
            let oldNodeId
            const procedure: Procedure = await this.procedureService.detailByFormId(formId)
            if (!data.dataGroup) {
                //第一次提交 进入流程发起节点
                data.dataGroup = uuid.v1()
                const startNode = procedure.nodes.find((n) => {
                    return n.clazz === 'start'
                })
                if (!startNode) {
                    throw new BadRequestException('no start node ')
                }
                data.crateIp = ip
                if (user)
                    data.createUserId = user.id
                data.currentProcedureNodeId = startNode.id
                data.endData = 'start'
                oldNodeId = startNode.id
                logData.action = startNode.name
            } else {
                //不是初次提交 根据当前登陆人员 获取 edge信息
                if (!user) {
                    throw new BadRequestException('未登陆，审核节点请先登陆')
                }
                data.submitUserId = user.id
                const todo: FormTodo = await this.formTodoService.findByUserAndFormData(user, formId, data.dataGroup)
                if (!todo || !todo.edge) {
                    logData.error = '对应流转条件已经删除'
                    throw new BadRequestException('对应流转条件已经删除')
                }
                //修改todo的状态
                FormTodo.update({status: '2', dealUserId: user.id}, {
                    where: {id: todo.id}
                })
                data.endData = 'task'
                data.currentProcedureNodeId = todo.edge.target

            }
            logData.formId = formId
            logData.groupId = data.dataGroup
            //校验流转规则 确定接下来的节点 并且生成对下一个节点流转人的代办事项
            // 提交节点的对应的流转规则
            const currentEdge = procedure.edges.filter((edge) => {
                    return edge.source === oldNodeId
                }
            )
            const endNode = procedure.nodes.find((node) => {
                return node.clazz === 'end'
            })
            //规则校验
            if (currentEdge && currentEdge.length !== 0) {

                const passEdge: ProcedureEdge[] = []
                const customPassEdge: ProcedureEdge[] = []
                currentEdge.forEach((edge) => {
                    //验证流转规则
                    if (edge.flow.conditiontype === 'custom') {
                        //自定义 规则校验
                        const firstUnPassCondition = edge.flow.conditions.find((condition) => {
                            switch (condition.conditionsRule) {
                                case 'equal':
                                    return data.data[condition.itemId] !== condition.value

                                case 'notEqual':
                                    return data.data[condition.itemId] === condition.value

                                case 'null':
                                    return !data.data[condition.itemId]
                                case 'notNull':
                                    return !!data.data[condition.itemId]
                                //复选值 其值为
                                case 'include':
                                    if (Array.isArray(data.data[condition.itemId])) {

                                    } else
                                        throw new BadRequestException(`${condition.itemId} 对应的值 必须是数组`)
                                    break
                                case 'exclude':
                                    break
                                default:
                                    throw new BadRequestException('未定义的提交校验条件')
                            }
                        })
                        if (!firstUnPassCondition) {
                            //该流程通过
                            customPassEdge.push(edge)
                        }

                    }
                    if (edge.flow.conditiontype === 'undefined') {
                        //该流程直接通过
                        passEdge.push(edge)
                    }
                })
                //else 规则校验 当具有自定义的edge全部未通过时通过
                if (customPassEdge.length === 0)
                    currentEdge.forEach((e) => {
                        if (e.flow.conditiontype === 'else') {
                            passEdge.push(e)
                        }
                    })
                passEdge.push(...customPassEdge)
                //对通过的edge进行处理 生成代办事项 每个人/部门一条？
                const toDo = []
                if (passEdge.length === 0) {
                    throw new BadRequestException('不满足任意流转条件，无法进入下一个流程')
                }
                passEdge.forEach((e) => {
                    const targetNode = procedure.nodes.find((node) => {
                        return node.id === e.target
                    })
                    toDo.push({
                        status: '1',
                        targetUserId: targetNode && targetNode.assignPerson,
                        targetDeptId: targetNode && targetNode.assignDept,
                        formId,
                        groupId: data.dataGroup,
                        //edge
                        edgeId: e.id
                    })

                })
                await this.formTodoService.bulkCreate(toDo)


            } else {
                //未找到流转规则 流程结束
                data.currentProcedureNodeId = endNode.id
                logData.action = endNode.name
                data.endData = 'end'
            }
        //todo 创建流程日志

        } else {
            //非流程节点
            data.endData = 'end'
        }
        return ResponseUtil.success(FormData.create(data))
    }


    async findByTodo(todo: FormTodo) {
        return FormData.findOne({
            where: {
                formId: todo.formId,
                dataGroup: todo.formDataGroup,
                currentProcedureNodeId: todo.edge.source
            }
        });
    }
}
