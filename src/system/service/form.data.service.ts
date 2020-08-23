import {BadRequestException, Get, HttpException, Injectable, Param, Query} from "@nestjs/common";
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
import {Column, Sequelize} from "sequelize-typescript";
import {FormDataQueryDto} from "../dto/form.data.query.dto";
import {ArrayUtil} from "../../common/util/array.util";
import FormDataAttach from "../../entity/form.data.attach.entity";
import moment from "moment";
import {FormItemInterface} from "../../entity/JSONDataInterface/FormItem.interface";
import DeptUsersEntity from "../../entity/dept.users.entity";
import RoleUser from "../../entity/role.user.entity";
import Role from "../../entity/Role.entity";
import Dept from "../../entity/Dept.entity";
import {Transaction} from "sequelize/types/lib/transaction";
import {PdfService} from "./pdf.service";
import {FileUploadConfig} from "../../common/file.upload.config";
import path from "path";
import Attachment from "../../entity/attachment.entity";
import * as fs from "fs";
import {FormPermissionService} from "./form.permission.service";


@Injectable()
export class FormDataService {
    constructor(private readonly procedureService: ProcedureService,
                private readonly formTodoService: FormTodoService,
                private readonly pdfService: PdfService,
                private readonly formPermissionService: FormPermissionService) {
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
            whereOptions.endData = {[Op.in]: dto.status.split(',')}
        const ands = []
        if (ArrayUtil.isNotNull(dto?.fliedQuery)) {
            const dataWhere: any = {}
            dto.fliedQuery.forEach((q) => {
                if (q.method && q.value) {
                    dataWhere[q.id] = this.toQueryOpt(q.method, q.value, dto.status)
                }
                // and 条件
                if (q.method === 'overlap' && q.value && Array.isArray(q.value) && q.value.length > 0) {
                    ands.push(Sequelize.literal(`"data"->'${q.id}' ?| array[${q.value.join(',')}]`))
                }
                if (q.method === 'contained' && q.value && Array.isArray(q.value) && q.value.length > 0) {
                    ands.push(Sequelize.literal(`"data"->'${q.id}' <@ '[${q.value.join(',')}]'::jsonb`))
                }
                if (q.method === 'overlap' && q.value && Array.isArray(q.value) && q.value.length > 0) {
                    ands.push(Sequelize.literal(`"data"->'${q.id}' @> '[${q.value.join(',')}]'::jsonb`))
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
        //无流程处理
        return FormData.create({data, formId, submitIp: ip, endData: 'import'})
    }


    async toUpdate(id: string) {
        const formData: FormData = await FormData.findByPk(id, {include: [{model: Form}]})
        if (!formData)
            throw new BadRequestException('error id')
        if (formData?.form.type === 'flow') {
            throw new BadRequestException('流程表单不可更新')
        }
        return {form: formData.form, status: '4', data: formData.data, formDataId: id}
    }

    async update(data: any, id: string) {
        //流程表单不可更新
        const formData: FormData = await FormData.findByPk(id, {include: [{model: Form}]})
        if (!formData)
            throw new BadRequestException('error id')
        if (formData?.todoId) {
            throw new BadRequestException('改流程已被处理，不可更新')
        }
        await this.verifyUnique(formData.form, data, false, formData.id)
        return FormData.update({data: data.data}, {
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
            const procedure: Procedure = await this.procedureService.detailByFormId(form.id, true)
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
                if (!user) {
                    throw new BadRequestException('未登陆，审核节点请先登陆')
                }
                //盘对流程是否结束
                //不是初次提交 根据todo进行流程审批
                const t: Transaction = await FormTodo.sequelize.transaction()
                let todo: FormTodo;
                try {
                    todo = await FormTodo.findByPk(dataDto.todoId, {
                        include: [{
                            model: ProcedureEdge,
                        }],
                        lock: {level: t.LOCK.UPDATE, of: FormTodo}
                    })
                    if (!todo || todo.status === '2') {
                        throw new BadRequestException('该代办事项不存在 或者 已被处理');
                    }
                    logData.groupId = todo.formDataGroup
                    formData.dataGroup = todo.formDataGroup
                    formData.todoId = todo.id

                    formData.submitUserId = user.id
                    formData.submitUserName = user.name
                    // if (!todo.edge) {
                    //     logData.result = '对应流转条件已经删除'
                    //     LogProcedure.create(logData)
                    //     throw new BadRequestException('对应流转条件已经删除')
                    // }
                    if (todo.submitRule === 'all') {
                        const allSubmit = await this.allSubmitHandle(todo, t, user, dataDto.handWritten)
                        if (allSubmit === false) {
                            await t.commit();
                            return;
                        }
                    }
                    await t.commit()
                } catch (e) {
                    t.rollback();
                    throw e;
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
                if (dataDto.handWritten && todo.submitRule === 'any')
                    formData.handWritten = dataDto.handWritten
                // else {
                //     formData.handWritten =
                // }
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
                    targetUserId: targetNode.submitRule === 'all' ? await this.getAllTargetUser(targetNode, formData.createUserId, formData.createUserDeptId) : await this.getTodoTargetUser(targetNode, formData),
                    targetDeptId: targetNode.submitRule === 'all' ? null : (targetNode && targetNode.assignDept),
                    targetRoleId: targetNode.submitRule === 'all' ? null : (targetNode && targetNode.assignRole),
                    targetDeptIdWhitRole: targetNode.submitRule === 'all' ? null : targetNode.dynamic?.submitterDeptRoles?.map((roleID) => formData.createUserDeptId + ":" + roleID),
                    onlySigned: targetNode.onlyExtra?.sign || false,
                    formId: form.id,
                    formTitle: form.name,
                    formDataGroup: formData.dataGroup,
                    createUser: formData.createUserName || '',
                    createUserId: formData.createUserName || '',
                    briefData,
                    submitRule: targetNode.submitRule,
                    nodeName: targetNode.label,
                    type: targetNode.clazz,
                    signGroup: targetNode.signGroup,
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

            await FormData.sequelize.transaction(t => {
                // throw new BadRequestException('121')
                const ps = []
                if (dataDto.todoId) {
                    ps.push(FormTodo.update({status: '2', dealUserId: user.id}, {
                        where: {id: dataDto.todoId}, transaction: t
                    }))
                }
                return Promise.all([
                    //处理老代办事项 修改状态
                    ...ps,
                    //创建代办事项
                    FormTodo.bulkCreate([...receiveTaskTodo, ...userTaskTodo], {transaction: t}),
                    //创建 formData
                    FormData.create(formData, {transaction: t})
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
            let itemValue = dataDto.data[condition.itemId]
            let res = false
            switch (condition.conditionsRule) {
                case 'equal':
                    res = dataDto.data[condition.itemId] !== condition.conditionsValue
                    if (res)
                        rReason.push(item.title + ' 需要等于 ' + condition.conditionsValue)
                    return res
                case 'notEqual':
                    res = dataDto.data[condition.itemId] === condition.conditionsValue
                    if (res)
                        rReason.push(item.title + ' 需要不等于 ' + condition.conditionsValue)
                    return res
                case 'null':
                    res = !!dataDto.data[condition.itemId]
                    if (res)
                        rReason.push(item.title + ' 需要为空 ')
                    return res
                case 'notNull':
                    res = !dataDto.data[condition.itemId]
                    if (res) {
                        console.log(dataDto.data[condition.itemId], item.title)
                        rReason.push(item.title + ' 需要为不空 ')
                    }
                    return res
                //复选值 其值为
                case 'include':
                    if (Array.isArray(dataDto.data[condition.itemId])) {
                        // dataDto.data[]
                        res = !dataDto.data[condition.itemId].includes(condition.conditionsValue)
                        if (res) {
                            rReason.push(item.title + ' 需要包含 ' + condition.conditionsValue)
                        }
                    } else if (typeof dataDto.data[condition.itemId] === 'string') {
                        res = !(dataDto.data[condition.itemId] as string).includes(condition.conditionsValue)
                        if (res)
                            rReason.push(item.title + ' 需要包含 ' + condition.conditionsValue)
                    } else {
                        throw new BadRequestException('error type of' + item.title, 'new array of string')
                    }
                    return res
                case 'exclude':
                    if (Array.isArray(dataDto.data[condition.itemId])) {
                        // dataDto.data[]
                        res = dataDto.data[condition.itemId].includes(condition.conditionsValue)
                        if (res) {
                            rReason.push(item.title + ' 需要不包含 ' + condition.conditionsValue)
                        }
                    } else if (typeof dataDto.data[condition.itemId] === 'string') {
                        res = (dataDto.data[condition.itemId] as string).includes(condition.conditionsValue)
                        if (res)
                            rReason.push(item.title + ' 需要不包含 ' + condition.conditionsValue)
                    } else {
                        throw new BadRequestException('error type of' + item.title, 'new array of string')
                    }
                    return res
                case 'includeAny':
                    if (!Array.isArray(condition.conditionsValue)) {
                        throw new BadRequestException('conditionsValue must be an array')
                    }
                    const value = dataDto.data[condition.itemId]
                    if (Array.isArray(value)) {
                        res = !ArrayUtil.hasUnion(value, condition.conditionsValue)
                    } else {
                        res = !condition.conditionsValue.includes(value)
                    }
                    if (res) {
                        rReason.push(item.title + ' 需要是' + condition.conditionsValue.join(',') + '中的任意一个')
                    }
                    return res
                case  'lte':
                    if (typeof condition.conditionsValue === "string") {
                        condition.conditionsValue = parseFloat(condition.conditionsValue)
                    }
                    if (typeof itemValue === 'string')
                        itemValue = parseFloat(itemValue)
                    res = itemValue > condition.conditionsValue
                    if (res)
                        rReason.push(item.title + ' 需要小于等于' + condition.conditionsValue)
                    return res
                case 'gte':
                    if (typeof condition.conditionsValue === "string") {
                        condition.conditionsValue = parseFloat(condition.conditionsValue)
                    }
                    if (typeof itemValue === 'string')
                        itemValue = parseFloat(itemValue)
                    res = itemValue < condition.conditionsValue
                    if (res)
                        rReason.push(item.title + ' 需要大于等于' + condition.conditionsValue)
                    return res
                case  'lt':
                    if (typeof condition.conditionsValue === "string") {
                        condition.conditionsValue = parseFloat(condition.conditionsValue)
                    }
                    if (typeof itemValue === 'string')
                        itemValue = parseFloat(itemValue)
                    res = itemValue >= condition.conditionsValue
                    if (res)
                        rReason.push(item.title + ' 需要小于' + condition.conditionsValue)
                    return res
                case 'gt':
                    if (typeof condition.conditionsValue === "string") {
                        condition.conditionsValue = parseFloat(condition.conditionsValue)
                    }
                    if (typeof itemValue === 'string')
                        itemValue = parseFloat(itemValue)
                    res = itemValue <= condition.conditionsValue
                    if (res)
                        rReason.push(item.title + ' 需要大于' + condition.conditionsValue)
                    return res
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


    //直接淘汰targetdept and targetrole
    async getAllTargetUser(node: ProcedureNode, createUserId: string, createUserDeptId: string) {
        const ps = []
        if (node.assignDept && node.assignDept?.length >= 1) {
            ps.push(DeptUsersEntity.findAll({where: {deptId: {[Op.in]: node.assignDept}}}).then((res: DeptUsersEntity[]) => {
                return res.map((r) => r.userId)
            }))
        }
        if (node.assignRole && node.assignRole?.length > 0) {
            ps.push(RoleUser.findAll({where: {roleId: {[Op.in]: node.assignRole}}}).then(res => {
                return res.map((r) => r.userId)
            }))
        }
        if (node.dynamic?.submitterDeptRoles && node.dynamic?.submitterDeptRoles?.length > 0) {
            ps.push(User.findAll({
                attributes: ['id'],
                include: [{
                    model: Role,
                    required: true,
                    attributes: ['id'],
                    where: {id: {[Op.in]: node.dynamic.submitterDeptRoles}}

                }, {
                    model: Dept,
                    required: true,
                    attributes: ['id'],
                    where: {id: createUserDeptId}
                }]

            }).then(res => res.map((u) => u.id)))
        }
        return Promise.all(ps).then((res) => {
            let userIds: string[] = res.reduce((p: [], r) => {
                return p.concat(r)
                // return p
            }, [])
            if (!userIds)
                userIds = []
            if (node.dynamic?.submitter && createUserId)
                userIds.push(createUserId)
            if (node.assignPerson && node.assignPerson?.length > 0) {
                userIds = userIds.concat(node.assignPerson)
            }
            return userIds
        })
    }

    async allSubmitHandle(formTodo: FormTodo, t: Transaction, user: User, handSign: { uid: string, url: string, status: string }): Promise<boolean> {
        if (!formTodo.submitters)
            formTodo.submitters = []
        if (!formTodo.submitterId)
            formTodo.submitterId = []
        if (formTodo?.submitters?.length < formTodo.targetUserId?.length) {
            if (!formTodo.submitters.find((s) => s.id === user.id)) {
                formTodo.submitters.push({
                    id: user.id,
                    name: user.name,
                    handSign,
                    submitTime: moment().format('YYYY-MM-DD hh:mm')
                })
                formTodo.submitterId.push(user.id)
                await FormTodo.update({
                    submitters: formTodo.submitters,
                    submitterId: formTodo.submitterId
                }, {where: {id: formTodo.id}, transaction: t})
            } else
                throw new BadRequestException('您已经处理过该流程')
        }
        return formTodo.submitters.length >= formTodo.targetUserId.length
    }

    // async handleBase64() {
    //     //
    // }

    async getSignGroup(formId: string) {
        return FormTodo.findAll({attributes: ['signGroup'], where: {formId: formId}, group: ['signGroup']})
    }

    async exportMeetingPdf(formDataId: string, itmeIds: string[], title: string, signGroup: string) {
        const formData: FormData = await FormData.findByPk(formDataId, {
            include: [{
                model: Form
            }]
        })
        const items = formData.form.items.filter((it) => itmeIds.includes(it.id))
        let sign = [];
        if (signGroup) {
            const where: any = {
                formId: formData.formId,
                formDataGroup: formData.dataGroup,
                signGroup,
            }

            const formTodos: FormTodo[] = await FormTodo.findAll({
                where
            })
            const basePath = FileUploadConfig.getUrl()
            sign = formTodos.reduce((p, c) => {
                return c.submitters.reduce((p1, c1) => {
                    if (Array.isArray(c1.handSign)) {
                        p1.push({name: c1.name, aId: c1.handSign[0]?.uid})
                    } else
                        p1.push({name: c1.name, aId: c1.handSign.uid})
                    return p1
                }, p)
                // return p
            }, [])
            if (sign.length > 0) {
                const attachments: Attachment[] = await Attachment.findAll({where: {id: {[Op.in]: sign.map((i) => i.aId)}}})
                sign.forEach((item: { name: string, aId: string, url: string }) => {
                    const att = attachments.find((a) => a.id === item.aId)
                    if (att)
                        item.url = 'data:image/png;base64,' + fs.readFileSync(path.join(basePath, '/', att.localPath)).toString('base64')
                })
                sign = sign.filter((i) => i.url !== null)
            }
        }

        return this.pdfService.genMeetingPdf(formData.data, items, sign, title)
        // const
    }

    async updateFlowData(data: FormData, user: User) {
        if (!data?.id) {
            throw new BadRequestException('error id')
        }
        const formData: FormData = await FormData.findByPk(data.id)
        const updateAble = await this.formPermissionService.verifyAble('update', formData.formId, user)
        //todo update log
        if (updateAble)
            return FormData.update(data, {where: {id: data.id}})
        else
            throw new BadRequestException('need updateAble permission')
    }

    async deleteFlowData(formDataId: string, user: User) {
        const formData: FormData = await FormData.findByPk(formDataId)
        const able = await this.formPermissionService.verifyAble('delete', formData.formId, user)
        if (able) {
            if (!formData.todoId && (formData.endData==='start' || formData.endData==='task'))
                // FormTodo.destroy({w})
                throw new BadRequestException('该数据处于待处理状态，无法执行删除')
            FormData.destroy({where: {id: formDataId}})
        } else
            throw new BadRequestException('need deleteAble permisson')
    }


    // async
}
