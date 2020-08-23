import {BadRequestException, Injectable} from "@nestjs/common";
import FormPermission from "../../entity/form.permission.entity";
import {ResponseUtil} from "../../common/response.util";
import {Op, or} from "sequelize";
import Dept from "../../entity/Dept.entity";
import Role from "../../entity/Role.entity";
import User from "../../entity/User.entity";
import {ArrayUtil} from "../../common/util/array.util";
import {Sequelize} from "sequelize-typescript";
import {PageQueryVo} from "../../common/pageQuery.vo";
import Form from "../../entity/form.entity";

@Injectable()
export class FormPermissionService {
    async create(formPermission: FormPermission) {
        if (!formPermission.formId)
            throw new BadRequestException('no form id')

        return FormPermission.findOrCreate({where: {formId: formPermission.formId}, defaults: formPermission})
    }

    async update(formPermission: FormPermission) {
        if (!formPermission.id)
            throw new BadRequestException('no id')
        if (!formPermission.formId)
            throw new BadRequestException('no form id')
        return FormPermission.update(formPermission, {where: {formId: formPermission.formId}})
    }

    async findByFormId(formId: string) {
        let formPermission: FormPermission = await FormPermission.findOne<FormPermission>({where: {formId}})
        //回填
        if (!formPermission) {
            return
        }
        const map: Map<string, string[]> = await this.groupIds(formPermission)
        const ps = []
        formPermission = formPermission.get({plain: true}) as FormPermission
        map.forEach(((value, key) => {
            if (value.length > 0)
                ps.push(FormPermission.sequelize.model(key).findAll({where: {id: {[Op.in]: value}}}).then((r) => {
                    this.backGroups(r, formPermission, key)
                }))
        }))
        await Promise.all(ps)
        return formPermission
    }

    async verifyAble(type: 'update' | 'show' | 'delete' | 'import', formId: string, user: User) {
        const formPermission: FormPermission = await FormPermission.findOne<FormPermission>({where: {formId}})
        if (!formPermission)
            return true
        if (!formPermission[type + 'Able']) {
            return true
        }
        const able = formPermission[type + 'Able'] as { deptIds: string[], roleIds: string[], userIds: string[] }
        return ArrayUtil.hasUnion(able.deptIds, user?.depts?.map((d) => d.id)) || ArrayUtil.hasUnion(able.roleIds, user?.roles?.map((r) => r.id))
            || able.userIds?.includes(user.id)
    }

    async ableList(types: string, user: User, pageQueryVo: PageQueryVo) {
        if (!types) {
            types = 'show'
        }
        const ors = []
        types.split(',').forEach((s) => {
            ors.push(Sequelize.literal(`"s_able"->'userIds' @>'["${user.id}"]'`))
            ors.push(Sequelize.literal(`"s_able"->'roleIds' ?| array[${user.roles.map((r) => r.id).join(',')}]`))
            ors.push(Sequelize.literal(`"s_able"->'deptIds' ?| array[${user.depts.map((r) => r.id).join(',')}]`))
        })
        return Form.findAndCountAll({
            ...pageQueryVo.toSequelizeOpt(),
            include: [{
                model: FormPermission,
                required: true,
                where: {[Op.or]: ors}
            }]
        })
    }


    async showAbleList(user: User, pageQueryVo: PageQueryVo) {
        //findShowAble
        const ors = []
        ors.push(Sequelize.literal(`"show_able"->'userIds' @>'["${user.id}"]'`))
        ors.push(Sequelize.literal(`"show_able"->'roleIds' ?| array[${user.roles.map((r) => r.id).join(',')}]`))
        ors.push(Sequelize.literal(`"show_able"->'deptIds' ?| array[${user.depts.map((r) => r.id).join(',')}]`))
        return FormPermission.findAndCountAll({
            include: [{
                model: Form,
                required:true
            }],
            ...pageQueryVo.toSequelizeOpt(), where: {
                [Op.or]: ors
            }
        })
    }


    async updateAble(user: User, pageQueryVo: PageQueryVo) {
        //findShowAble
        const ors = []
        ors.push(Sequelize.literal(`"update_able"->'userIds' @>'["${user.id}"]'`))
        ors.push(Sequelize.literal(`"update_able"->'roleIds' ?| array[${user.roles.map((r) => r.id).join(',')}]`))
        ors.push(Sequelize.literal(`"update_able"->'deptIds' ?| array[${user.depts.map((r) => r.id).join(',')}]`))
        return FormPermission.findAndCountAll({
            ...pageQueryVo.toSequelizeOpt(), where: {
                [Op.or]: ors
            }
        })
    }

    async deleteAble(user: User, pageQueryVo: PageQueryVo) {
        //findShowAble
        const ors = []
        ors.push(Sequelize.literal(`"delete_able"->'userIds' @>'["${user.id}"]'`))
        ors.push(Sequelize.literal(`"delete_able"->'roleIds' ?| array[${user.roles.map((r) => r.id).join(',')}]`))
        ors.push(Sequelize.literal(`"delete_able"->'deptIds' ?| array[${user.depts.map((r) => r.id).join(',')}]`))
        return FormPermission.findAndCountAll({
            ...pageQueryVo.toSequelizeOpt(), where: {
                [Op.or]: ors
            }
        })
    }


    async groupIds(formPermission: FormPermission, map?: Map<string, string[]>) {
        const keys = ['updateAble', 'showAble', 'deleteAble', 'importAble']
        if (!map) {
            map = new Map()
            map.set('Dept', [])
            map.set('Role', [])
            map.set('User', [])
        }
        keys.forEach((key) => {
            const data = formPermission[key] as { deptIds: string[], roleIds: string[], userIds: string[] }
            if (data)
                map.forEach((v, k) => {
                    if (data[k.toLocaleLowerCase() + 'Ids'])
                        map[k] = v.concat(data[k])
                })
        })
        return map
    }

    async backGroups(data: [Dept | Role | User], formPermission: FormPermission, type: string) {
        const keys = ['updateAble', 'showAble', 'deleteAble', 'importAble']
        keys.forEach((key) => {
            const someAble = formPermission[key] as { deptIds: string[], roleIds: string[], userIds: string[] }
            const someAbleIds: string[] = someAble[type.toLocaleLowerCase() + 'Ids']
            if (someAbleIds) {
                if (!someAble[key.toLocaleLowerCase()])
                    someAble[key.toLocaleLowerCase()] = []
                someAbleIds.forEach((s) => {
                    const find = data.find((r) => r.id === s)
                    if (find)
                        someAble[key.toLocaleLowerCase()].push(find)
                })

            }
        })

    }

    async upsert(formPermission: FormPermission) {
        // [].forEach((k,index)=>{})


        if (!formPermission.formId)
            throw new BadRequestException('need formId')
        const permissions = await FormPermission.findOne({where: {formId: formPermission.formId}})
        if (formPermission)
            return this.create(formPermission)
        else
            return this.update(formPermission)

    }
}



