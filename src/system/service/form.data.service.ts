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
import {and, Op, where} from "sequelize";
import LogProcedure from "../../entity/log.procedure.entity";
import {FormDataSubmitDto} from "../dto/form.data.submit.dto";
import ProcedureNode from "../../entity/procedure.node.entity";
import {Sequelize} from "sequelize-typescript";
import {FormDataQueryDto} from "../dto/form.data.query.dto";
import {ArrayUtil} from "../../common/util/array.util";
import FormDataAttach from "../../entity/form.data.attach.entity";
import moment from "moment";
import {FormItemInterface} from "../../entity/JSONDataInterface/FormItem.interface";


@Injectable()
export class FormDataService {
    constructor(private readonly procedureService: ProcedureService,
                private readonly formTodoService: FormTodoService) {
    }

    async list(pageQueryVo: PageQueryVo, formId: string, dto: FormDataQueryDto) {
        const whereOptions: any = {}
        if (dto?.nodeId) {
            if (dto?.nodeId === 'start')
                whereOptions.endData = 'start'
            else if (dto?.nodeId === 'end')
                whereOptions.endData = 'end'
            else
                whereOptions.currentProcedureNodeId = dto?.nodeId
        }
        if (dto?.status)
            whereOptions.endData = dto?.status
        const ands = []
        if (ArrayUtil.isNotNull(dto?.fliedQuery)) {
            const dataWhere: any = {}
            dto.fliedQuery.forEach((q) => {
                if (q.method && q.value) {
                    dataWhere[q.id] = this.toQueryOpt(q.method, q.value, dto.status)
                }
            })
            whereOptions.data = dataWhere
        }
        return FormData.findAndCountAll({
            where: {formId, ...whereOptions, [Op.and]: ands},
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset(),
            include: [{
                model: ProcedureNode,
                attributes: ['id', 'name']
            }],
            order: ['createTime']
        })
    }

    async add(data: any, formId: string, ip: string) {
        //流程

        return FormData.create({data, formId, submitIp: ip, endData: true})
    }


    async toUpdate(id: string) {
        const formData: FormData = await FormData.findByPk(id, {include: [{model: Form}]})
        if (!formData)
            throw new BadRequestException('error id')
        if (formData?.form.type === 'flow') {
            throw new BadRequestException('流程表单不可更新')
        }
        return {from: formData.form}
    }

    async update(data: any, id: string) {
        //流程表单不可更新
        const formData: FormData = await FormData.findByPk(id, {include: [{model: Form}]})
        if (!formData)
            throw new BadRequestException('error id')
        if (formData?.form.type === 'flow') {
            throw new BadRequestException('流程表单不可更新')
        }
        await this.verifyUnique(formData.form, data, false, formData.id)
        return FormData.update({data}, {
            where: {id},
        })
    }

    // async find

    async submit(dataDto: FormDataSubmitDto, form: Form, ip?: string, user?: User) {
        // unique verify
        await this.verifyUnique(form, dataDto.data, form.type === 'flow')
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
            if (procedure?.status === '2') {
                throw  new BadRequestException('流程已被禁用')
            }
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
                formData.createUserId = user?.id
                formData.createUserDeptId = user?.depts[0]?.id
                formData.createUserName = user?.name || '未登录'
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
                const oldData: FormData = await FormData.findOne({
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
                    formData.createUserDeptId = oldData.createUserDeptId
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

    async endFlow(formId: string, dataGroup: string, nodeId: string, user: User, data: FormData, receiveTaskTodo?) {
        const p = []

        p.push(FormTodo.update({status: '2'}, {
            where: {
                formId: formId || data.formId, formDataGroup: dataGroup || data.dataGroup
            }
        }))
        if (receiveTaskTodo) {
            p.push(this.formTodoService.bulkCreate(receiveTaskTodo))
        }
        if (data) {
            data.endData = 'end'
            p.push(FormData.create(data).then(res => {
                FormData.update({dataGroupStatus: '2'}, {
                    where: {
                        formId: formId,
                        dataGroup: data.dataGroup
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
    }


    private async flowWork(procedure: Procedure, formData, dataDto, logData, form: Form, user) {
        //校验流转规则 确定接下来的节点 并且生成对下一个节点流转人的代办事项
        // 提交节点的对应的流转规则
        const doNodeProcedure = procedure.edges.filter((edge) => {
                return edge.source === formData.currentProcedureNodeId
            }
        )
        const endNode = procedure.nodes.find((node) => {
            return node.clazz === 'end'
        })
        //规则校验
        const rReason: string[] = []
        if (doNodeProcedure && doNodeProcedure.length !== 0) {
            const passEdge: ProcedureEdge[] = []
            const customPassEdge: ProcedureEdge[] = []
            //else 条件是否通过 如果有 custom 和 undefined 类型 条件通过 则为false  else 对抄送节点同样生效
            doNodeProcedure.forEach((targetEdge) => {
                //验证流转规则
                if (targetEdge.flow.conditiontype === 'custom' && targetEdge.flow.conditions) {
                    //自定义 规则校验 对提交数据进行校验
                    const find = this.customEdgePass(targetEdge, form, dataDto, rReason)
                    if (!find) {
                        //该流程通过
                        customPassEdge.push(targetEdge)
                    }
                }
                if (targetEdge.flow.conditiontype === 'custom' && !targetEdge.flow.conditions) {
                    customPassEdge.push(targetEdge)
                }
                if (targetEdge.flow.conditiontype === 'undefined') {
                    //该流程直接通过
                    passEdge.push(targetEdge)
                }
            })
            //else 规则校验 当具有自定义的edge全部未通过时通过
            if (customPassEdge.length === 0)
                doNodeProcedure.forEach((e) => {
                    if (e.flow.conditiontype === 'else') {
                        passEdge.push(e)
                    }
                })
            passEdge.push(...customPassEdge)
            //对通过的edge进行处理 生成代办事项 每个人/部门一条？
            if (passEdge.length === 0) {
                logData.result = '不满足任意流转条件，无法进入下一个流程'
                logData.resultStatus = 'error'
                await LogProcedure.create(logData)
                throw new BadRequestException(rReason.join(' 或者 '))
            }
            const userTaskTodo = []
            const receiveTaskTodo = []
            let endFlow = false
            for (const targetEdge of passEdge) {
                const targetNode: ProcedureNode = procedure.nodes.find((node) => {
                    return node.id === targetEdge.target
                })
                if (targetNode.clazz === 'end') {
                    // FormData.sequelize.transaction(t => {})
                    //进入流程结束
                    logData.action = endNode.name
                    logData.result = '流程结束'
                    logData.resultStatus = 'end'
                    LogProcedure.create(logData)
                    endFlow = true
                }
                // if (targetNode.)
                //组装简报
                const briefData: any = this.briefData(targetNode, formData, form)
                //代办事项
                const todoRow = {
                    status: targetNode.clazz === 'receiveTask' ? '2' : '1',
                    targetUserId: this.getTodoTargetUser(targetNode, formData),
                    targetDeptId: targetNode && targetNode.assignDept,
                    targetRoleId: targetNode && targetNode.assignRole,
                    targetDeptIdWhitRole: targetNode.dynamic?.submitterDeptRoles?.map((roleID) => formData.createUserDeptId + ":" + roleID),
                    onlySigned: targetNode.onlyExtra?.sign || false,
                    formId: form.id,
                    formTitle: form.name,
                    formDataGroup: formData.dataGroup,
                    createUser: formData.createUserName || '',
                    createUserId: formData.createUserName || '',
                    briefData,
                    nodeName: targetNode.label,
                    type: targetNode.clazz,
                    //edge
                    edgeId: targetEdge.id,
                    preTodoId: dataDto.todoId || '0'
                }
                if (targetNode.clazz === 'receiveTask')
                    receiveTaskTodo.push(todoRow)
                if (targetNode.clazz === 'userTask') {
                    userTaskTodo.push(todoRow)
                }
            }
            logData.result = '处理成功'
            logData.resultStatus = 'success'

            //formData 简报组装
            const saveNode = procedure.nodes.find((node) => {
                return node.id === formData.currentProcedureNodeId
            })

            formData.briefData = this.briefData(saveNode, formData, form)

            //创建日志
            LogProcedure.create(logData)
            if (endFlow === true || userTaskTodo.length === 0) {
                //流程结束前处理代办事项
                await FormTodo.update({status: '2', dealUserId: user.id}, {
                    where: {id: dataDto.todoId}
                })
                await this.endFlow(form.id, formData.dataGroup, formData.currentProcedureNodeId, user, formData, receiveTaskTodo)
                return '流程结束';
            }
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
                    this.formTodoService.bulkCreate([...userTaskTodo, ...receiveTaskTodo]),
                    //创建 formData
                    FormData.create(formData)
                ])
            })
            return '提交成功'
        } else {
            //该节点没有任何后续节点 流程结束
            formData.currentProcedureNodeId = endNode.id
            logData.action = endNode.name
            logData.result = '流程结束'
            logData.resultStatus = 'end'
            LogProcedure.create(logData)
            await this.endFlow(null, null, null, user, formData)
            return '流程结束'
        }

    }

    async verifyUnique(form: Form, data: any, flow: boolean, formDataId?: string) {
        const res = form.items.reduce((r, current) => {
            if (current.noRepeat === true) {
                r.ors.push({data: {[current.id]: data[current.id]}})
                r.items.push(current)
            }
            return r
        }, {ors: [], items: []})
        const whereOptions: any = {}
        if (flow) {
            whereOptions.endData = 'start'
        }
        if (formDataId)
            whereOptions.id = {[Op.ne]: formDataId}
        if (res.items.length !== 0) {
            const dbData = await FormData.findOne({
                where: {formId: form.id, ...whereOptions, [Op.or]: res.ors}
            })
            if (dbData) {
                throw new BadRequestException(res.items.map((i: FormItemInterface) => i.title).join(',') + '不允许重复')
            }
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

        await FormTodo.update({status: '2', dealUserId: user.id}, {
            where: {id: todoId}
        })
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

    private getTodoTargetUser(targetNode: ProcedureNode, formData: FormData) {
        let targetUserId = targetNode.assignPerson
        if (targetNode.dynamic) {
            if (targetNode.dynamic.submitter) {
                if (!targetUserId)
                    targetUserId = []
                targetUserId.push(formData.submitUserId)
            }
        }
        return targetUserId
    }


    customEdgePass(targetEdge, form, dataDto, rReason,) {
        return targetEdge.flow.conditions.find((condition) => {
            const item = form.items.find((i) => {
                return i.id === condition.itemId
            })
            switch (condition.conditionsRule) {
                case 'equal':
                    let res = false
                    res = dataDto.data[condition.itemId] !== condition.conditionsValue
                    if (res)
                        rReason.push(item.title + ' 需要等于 ' + condition.conditionsValue)
                    return res
                case 'notEqual':
                    let res2 = false
                    res2 = dataDto.data[condition.itemId] === condition.conditionsValue
                    if (res2)
                        rReason.push(item.title + ' 需要不等于 ' + condition.conditionsValue)
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
                default:
                    throw new BadRequestException('未定义的提交校验条件')
            }
        })
    }


    async groupByForm(endData: 'start' | 'end', user: User) {
        return FormData.findAll({
            where: {
                createUserId: user.id,
                endData,
            },
            include: [{
                model: Form,
                attributes: ['name'],
                required: true
            }],
            group: ['formId', Sequelize.col('form.name'), Sequelize.col('form.id')],
            attributes: ['formId', [Sequelize.fn('COUNT', Sequelize.col('FormData.id')), 'formCount']]
        })
    }

    async listByEndData(user: User, pageQueryVo: PageQueryVo, endData: string, formId?: string) {
        //
        return FormData.findAndCountAll({
            where: {
                createUserId: user.id,
                endData,
                formId
            },
            include: [{
                model: Form,
                attributes: ['id', 'name']
            }],
            attributes: {exclude: ['data']},
            order: [['updatedAt', 'DESC']],
            limit: pageQueryVo.limit(),
            offset: pageQueryVo.offset()
        });
    }

    private briefData(node: ProcedureNode, formData, form: Form) {
        const briefData: any = {}
        if (node.letter && node.letter.length !== 0)
            node.letter.filter((s) => {
                return s.includes(':brief')
            }).map((s) => {
                const id = s.replace(':brief', '')
                const item = form.items.find((i) => {
                    return i.id === id
                })
                if (item && typeof formData.data[id] === 'string')
                    briefData[id] = {
                        label: item.title,
                        value: formData.data[id]
                    }
            })
        return briefData
    }

    private toQueryOpt(method, value: any, status: string) {
        if (Array.isArray(value))
            value = value.join(',')
        switch (method) {
            case "gt":
                return {[Op.gt]: value}
            case "gte":
                return {[Op.gte]: value}
            case "eq":
                return {[Op.eq]: value}
            case "lt":
                return {[Op.lt]: value}
            case "lte":
                return {[Op.lte]: value}
            case 'null':
                return {[Op.is]: null}
            case 'notNull':
                return {[Op.not]: null}
            // case 'overlap':
            //     return {[Op.overlap]: value}
        }
    }

    async cancel(id: string) {
        const data: FormData = await FormData.findByPk(id, {include: [{model: Form}]})
        if (!data)
            throw new BadRequestException('error id ')
        if (!data.form.cancelAbel)
            throw new BadRequestException('该表单不允许撤回')
        // const otherData = await FormData.findOne({where:{formId:data.formId,dataGroup:data.dataGroup,endData:'task'}})
        // if (otherData)
        //     throw new BadRequestException('该表单已进入审核 不允许回撤')
        //删除 该数据 同时删除 代办事项
        FormData.sequelize.transaction(t => {
            return Promise.all([
                FormData.destroy({where: {formId: data.formId, dataGroup: data.dataGroup}}),
                FormTodo.destroy({where: {formId: data.formId, formDataGroup: data.dataGroup}})
            ])
        })
    }


    async delete(id: string) {
        return FormData.destroy({where: {id, endData: {[Op.in]: ['import', 'end']}}});
    }

    async check(user: User, formDataId: string) {
        const find = await FormDataAttach.findOne({
            where: {
                formDataId,
                createdAt: {[Op.gt]: moment().subtract('12', 'h')}
            }
        })
        if (find)
            throw new BadRequestException('一天内被盘点过')
        return FormDataAttach.create({formDataId, userId: user.id, checkUserName: user.name})
    }

    async checkList(formId: string, pageQueryVo: PageQueryVo, dto: FormDataQueryDto) {
        const formDataWhere: any = {}
        if (dto.nodeId) {
            if (dto.nodeId === 'start')
                formDataWhere.endData = 'start'
            else if (dto.nodeId === 'end')
                formDataWhere.endData = 'end'
            else
                formDataWhere.currentProcedureNodeId = dto.nodeId
        }
        if (dto.status)
            formDataWhere.endData = dto.status

        if (ArrayUtil.isNotNull(dto.fliedQuery)) {
            const dataWhere: any = {}
            dto.fliedQuery.forEach((q) => {
                if (q.method && q.value) {
                    dataWhere[q.id] = this.toQueryOpt(q.method, q.value, dto.status)
                }
            })
            formDataWhere.data = dataWhere
        }
        formDataWhere.formId = formId
        const page: { rows: FormDataAttach[]; count: number } = await FormDataAttach.findAndCountAll({
            ...pageQueryVo.toSequelizeOpt(),
            include: [{
                model: FormData,
                where: formDataWhere,
                required: true
            }]
        })
        const data = page.rows
        page.rows = data.map((attach) => {
            const formData = (attach.get({plain: true}) as any).formData
            formData.data.checkUserName = attach.checkUserName
            formData.data.checkTime = attach.createdAt.toLocaleString()
            return formData
        })
        return page
    }
}
