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
import LogProcedure from "../../entity/log.procedure.entity";
import {FormDataSubmitDto} from "../dto/form.data.submit.dto";
import {pseudoRandomBytes} from "crypto";
import ProcedureNode from "../../entity/procedure.node.entity";


@Injectable()
export class FormDataService {
    constructor(private readonly procedureService: ProcedureService,
                private readonly formTodoService: FormTodoService) {
    }

    async list(pageQueryVo: PageQueryVo, formId: string) {
        return FormData.findAndCountAll({
            where: {formId, endData: 'end'},
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

    async submit(dataDto: FormDataSubmitDto, form :Form, ip?: string, user?: User) {
        //第一次提交时候 自动赋予start
        //获取表单

        const formData: any = {}
        formData.formId = form.id
        formData.data = dataDto.data
        formData.dataGroupStatus = '1'
        if (form.type === 'flow') {
            //日志数据
            const logData: any = {}
            //流程表单
            logData.formId = form.id
            const procedure: Procedure = await this.procedureService.detailByFormId(form.id)
            if (!dataDto.todoId) {
                //第一次提交 进入流程发起节点
                formData.dataGroup = uuid.v1()
                logData.groupId = formData.dataGroup
                const startNode = procedure.nodes.find((n) => {
                    return n.clazz === 'start'
                })
                if (!startNode) {
                    throw new BadRequestException('no start node ')
                }
                //======填装初始数据====
                formData.crateIp = ip
                if (user){
                    formData.createUserId = user.id
                    formData.createUserName = user.name
                }

                formData.currentProcedureNodeId = startNode.id
                formData.endData = 'start'
                logData.action = startNode.name
            } else {
                //盘对流程是否结束
                //不是初次提交 根据todo进行流程审批
                const todo: FormTodo = await FormTodo.findByPk(dataDto.todoId, {
                    include: [{
                        model: ProcedureEdge
                    }]
                })
                if (!todo || todo.status === '2') {
                    throw new BadRequestException('该代办事项不存在 或者 已被处理');
                }
                logData.groupId = todo.formDataGroup
                formData.dataGroup = todo.formDataGroup
                formData.todoId = todo.id
                if (!user) {
                    throw new BadRequestException('未登陆，审核节点请先登陆')
                }
                formData.submitUserId = user.id
                formData.submitUserName = user.name
                if (!todo.edge) {
                    logData.result = '对应流转条件已经删除'
                    LogProcedure.create(logData)
                    throw new BadRequestException('对应流转条件已经删除')
                }
                const oldData = await FormData.findOne({
                    where: {
                        formId: todo.formId,
                        dataGroup: todo.formDataGroup
                    }
                })
                // if (oldData && oldData.endData === 'end') {
                //     throw new BadRequestException('该流程已经结束，请刷新代办事项列表')
                // }
                if (oldData) {
                    formData.crateIp = oldData.crateIp
                    formData.createTime = oldData.createTime
                    formData.createUserId = oldData.createUserId
                    formData.createUserName = oldData.createUserName
                    // formData.dataGroup  = oldData.dataGroup
                }
                if (dataDto.suggest)
                    formData.suggest = dataDto.suggest
                if (dataDto.handWritten)
                    formData.handWritten = dataDto.handWritten
                formData.endData = 'task'
                formData.currentProcedureNodeId = todo.edge.target

            }
            logData.nodeId = formData.currentProcedureNodeId
            if (user)
                logData.submitUserId = user.id

            return await this.flowWork(procedure, formData, dataDto, logData, form, user)

        } else {
            //非流程节点
            formData.endData = 'end'
            formData.dataGroupStatus = '2'
            if (user)
                formData.createUserId = user.id
            formData.crateIp = ip


            // 保存数据
            await FormData.create(formData)
            return '提交成功'
        }
    }


    async findByTodo(todo: FormTodo, nodeId?: string) {
        return FormData.findOne({
            where: {
                formId: todo.formId,
                dataGroup: todo.formDataGroup,
                currentProcedureNodeId: nodeId || todo.edge.source
            },
        });
    }

    async endFlow(formId: string, dataGroup: string, nodeId: string, user: User, data: FormData) {
        const p = []
        p.push(FormTodo.update({status: '2', dealUserId: user.id}, {
            where: {
                formId: formId || data.formId, formDataGroup: dataGroup || data.dataGroup
            }
        }))
        if (data) {
            data.endData = 'end'
            p.push(FormData.create(data).then(res => {
                FormData.update({dataGroupStatus: '2'}, {
                    where: {
                        formId: formId,
                        formDataGroup: data.dataGroup
                    }
                })
                return res
            }))
        } else {
            p.push(FormData.update({endData: 'end'}, {
                where: {
                    formId, dataGroup, currentProcedureNodeId: nodeId
                }
            }))
        }
        return FormTodo.sequelize.transaction(t => {
            return Promise.all(p)
        })

        //data
    }

    async reBack(todoId: string, user: User) {
        // 改变当前代办事项状态
        //重新生成上个节点的代办事项
        // 日志处理
        const todo: FormTodo = await FormTodo.findByPk(todoId)
        if (todo && todo.preTodoId && todo.preTodoId !== '0') {

            const proTodo = await FormTodo.findByPk(todo.preTodoId, {
                raw: true
            })
            delete proTodo.id
            delete proTodo.dealUserId
            proTodo.status = '1'
            FormTodo.sequelize.transaction(t => {
                return Promise.all([
                    FormTodo.update({status: '2', dealUserId: user.id}, {
                        where: {id: todoId}
                    }),
                    FormTodo.create(proTodo)
                ])
            })

            return '退回成功'
        } else {
            throw new BadRequestException('无法退回，请检查是否是初始节点')
        }
        return undefined;
    }

    private async flowWork(procedure, formData, dataDto, logData, form: Form, user) {
        //校验流转规则 确定接下来的节点 并且生成对下一个节点流转人的代办事项
        // 提交节点的对应的流转规则
        const procedureEdges = procedure.edges.filter((edge) => {
                return edge.source === formData.currentProcedureNodeId
            }
        )
        const endNode = procedure.nodes.find((node) => {
            return node.clazz === 'end'
        })
        //规则校验
        const rReason: string[] = []
        if (procedureEdges && procedureEdges.length !== 0) {
            const passEdge: ProcedureEdge[] = []
            const customPassEdge: ProcedureEdge[] = []
            procedureEdges.forEach((edge) => {
                //验证流转规则
                if (edge.flow.conditiontype === 'custom' && edge.flow.conditions) {
                    //自定义 规则校验 对提交数据进行校验
                    const firstUnPassCondition = edge.flow.conditions.find((condition) => {
                        const item = form.items.find((i) => {
                            return i.id === condition.itemId
                        })
                        switch (condition.conditionsRule) {
                            case 'equal':
                                let res = false
                                let value
                                if (item.type === 'radios' || item.type === 'checks' || item.type === 'select' || item.type === 'selectCheck') {
                                    value = JSON.parse(condition.conditionsValue)['value']
                                    res = dataDto.data[condition.itemId] !== value
                                } else
                                    res = dataDto.data[condition.itemId] !== condition.conditionsValue
                                if (res)
                                    rReason.push(item.title + ' 需要等于 ' + value || condition.conditionsValue)
                                return res
                            case 'notEqual':
                                let res2 = false
                                let value2
                                if (item.type === 'radios' || item.type === 'checks' || item.type === 'select' || item.type === 'selectCheck') {
                                    value2 = JSON.parse(condition.conditionsValue)['value']
                                    res2 = dataDto.data[condition.itemId] === value2
                                } else
                                    res2 = dataDto.data[condition.itemId] === condition.conditionsValue
                                if (res2)
                                    rReason.push(item.title + ' 需要不等于 ' + value2 || condition.conditionsValue)
                                return res2
                            case 'null':
                                const res3 = !!dataDto.data[condition.itemId]
                                if (res)
                                    rReason.push(item.title + ' 需要为空 ')
                                return res3
                            case 'notNull':
                                const res4 = !dataDto.data[condition.itemId]
                                if (res4) {
                                    console.log(dataDto.data[condition.itemId], item.title)
                                    rReason.push(item.title + ' 需要为不空 ')
                                }
                                return res4
                            //复选值 其值为
                            case 'include':
                                let res5 = false
                                if (Array.isArray(dataDto.data[condition.itemId])) {
                                    // dataDto.data[]
                                    res5 = !dataDto.data[condition.itemId].includes(condition.conditionsValue)
                                    if (res5) {
                                        rReason.push(item.title + ' 需要包含 ' + condition.conditionsValue)
                                    }
                                } else if (typeof dataDto.data[condition.itemId] === 'string') {
                                    res5 = !(dataDto.data[condition.itemId] as string).includes(condition.conditionsValue)
                                    if (res5)
                                        rReason.push(item.title + ' 需要包含 ' + condition.conditionsValue)
                                } else {
                                    throw new BadRequestException('error type of' + item.title, 'new array of string')
                                }
                                return res5
                                break
                            case 'exclude':
                                let res6 = false
                                if (Array.isArray(dataDto.data[condition.itemId])) {
                                    // dataDto.data[]
                                    res6 = dataDto.data[condition.itemId].includes(condition.conditionsValue)
                                    if (res6) {
                                        rReason.push(item.title + ' 需要不包含 ' + condition.conditionsValue)
                                    }
                                } else if (typeof dataDto.data[condition.itemId] === 'string') {
                                    res6 = (dataDto.data[condition.itemId] as string).includes(condition.conditionsValue)
                                    if (res6)
                                        rReason.push(item.title + ' 需要不包含 ' + condition.conditionsValue)
                                } else {
                                    throw new BadRequestException('error type of' + item.title, 'new array of string')
                                }
                                return res6
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
                procedureEdges.forEach((e) => {
                    if (e.flow.conditiontype === 'else') {
                        passEdge.push(e)
                    }
                })
            passEdge.push(...customPassEdge)
            //对通过的edge进行处理 生成代办事项 每个人/部门一条？
            const toDo = []
            if (passEdge.length === 0) {
                logData.result = '不满足任意流转条件，无法进入下一个流程'
                logData.resultStatus = 'error'
                await LogProcedure.create(logData)
                throw new BadRequestException(rReason.join(' 或者 '))
            }
            for (const edge of passEdge) {
                const targetNode = procedure.nodes.find((node) => {
                    return node.id === edge.target
                })
                if (targetNode.clazz === 'end') {
                    // FormData.sequelize.transaction(t => {})
                    //进入流程结束
                    logData.action = endNode.name
                    logData.result = '流程结束'
                    logData.resultStatus = 'end'
                    LogProcedure.create(logData)
                    await this.endFlow(form.id, formData.dataGroup, formData.currentProcedureNodeId, user, formData)
                    return '流程结束';
                }
                // if (targetNode.)
                //组装简报
                const briefData: any = {}
                if (targetNode.letter && targetNode.letter.length !== 0)
                    targetNode.letter.filter((s) => {
                        return s.includes(':brief')
                    }).map((s) => {
                        const id = s.replace(':brief', '')
                        const item = form.items.find((i) => {
                            return i.id === id
                        })
                        if (item)
                            briefData[id] = {
                                label: item.title,
                                value: formData.data[id]
                            }
                    })


                toDo.push({
                    status: '1',
                    targetUserId: targetNode && targetNode.assignPerson,
                    targetDeptId: targetNode && targetNode.assignDept,
                    formId: form.id,
                    formTitle: form.name,
                    formDataGroup: formData.dataGroup,
                    createUser: user && user.name || '',
                    briefData,
                    nodeName: targetNode.label,
                    type: targetNode.clazz,
                    //edge
                    edgeId: edge.id,
                    preTodoId: dataDto.todoId || '0'
                })
            }
            logData.result = '处理成功'
            logData.resultStatus = 'success'

            //创建日志
            LogProcedure.create(logData)
            const ps = []
            if (dataDto.todoId) {
                ps.push(FormTodo.update({status: '2', dealUserId: user.id}, {
                    where: {id: dataDto.todoId}
                }))
            }
            await FormData.sequelize.transaction(t => {
                return Promise.all([
                    //处理老代办事项 修改状态
                    ...ps,
                    //创建代办事项
                    this.formTodoService.bulkCreate(toDo),
                    //创建 formData
                    FormData.create(formData)
                ])
            })
            return '提交成功'
        } else {
            //未找到流转规则 流程结束
            formData.currentProcedureNodeId = endNode.id
            logData.action = endNode.name
            logData.result = '流程结束'
            logData.resultStatus = 'end'
            LogProcedure.create(logData)
            await this.endFlow(null, null, null, user, formData)
            return '流程结束'
        }

    }

    async end(todoId: string, user: User, formDto: FormDataSubmitDto) {
        const formData: any = {}
        const todo: FormTodo = await FormTodo.findByPk(todoId, {
            include: [{
                model: ProcedureEdge
            }]
        })
        if (!todo)
            throw new BadRequestException('no entity with id')
        formData.formId = todo.formId
        formData.dataGroup = todo.formDataGroup
        formData.data = formDto.data
        formData.suggest = formDto.suggest
        formData.handWritten = formDto.handWritten
        const oldData = await FormData.findOne({
            where: {
                formId: todo.formId,
                dataGroup: todo.formDataGroup
            }
        })
        if (oldData && oldData.endData === 'end') {
            throw new BadRequestException('该流程已经结束，请刷新代办事项列表')
        }
        if (oldData) {
            formData.createTime = oldData.createTime
            formData.createUserId = oldData.createUserId
            formData.crateIp = oldData.crateIp
        }


        this.endFlow(null, null, null, user, formData)
        return undefined;
    }

    async findByTodoId(todoId: string) {
        return FormData.findOne({
            where: {
                todoId
            }
        })
    }
}
