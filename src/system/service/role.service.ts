import {BadRequestException, Injectable} from "@nestjs/common";
import Role from "../../entity/Role.entity";
import {PageQueryVo} from "../../common/pageQuery.vo";
import User from "../../entity/User.entity";
import RoleUser from "../../entity/role.user.entity";
import {Op} from "sequelize";
import {ArrayUtil} from "../../common/util/array.util";

@Injectable()
export class RoleService {
    async create(role: Role) {
        await this.verifyParentId(role)
        return Role.create(role)
    }

    async list(rootDeptId: string, noBuildTree?: string) {
        const whereOptions: any = {}
        if (rootDeptId)
            whereOptions.rootDeptId = rootDeptId
        const roles: Role[] = await Role.findAll({where: whereOptions})
        if (noBuildTree)
            return roles
        return roles.filter((r) => r.parentId === '0').map((r) => {
            const d: any = r.get({plain: true})
            d.title = d.name
            d.value = d.id
            d.children = this.setChildren(d, roles)
            return d
        })
    }

    private setChildren(parent, roles: Role[]) {
        return roles.filter((r) => r.parentId === parent.id).map((r) => {
            const child: any = r.get({plain: true})
            child.title = child.name
            child.value = child.id
            child.children = this.setChildren(child, roles)
            return child
        })
    }

    async update(role: Role) {
        delete role.rootDeptId
        await this.verifyParentId(role)
        return Role.update(role, {where: {id: role.id}})
    }

    async delete(id: string) {
        const hasChild = Role.count({where: {parentId: id}})
        if (hasChild > 0)
            throw new BadRequestException('该部门有子部门,无法删除')
        const hasUser = RoleUser.count({where: {roleId: id}})
        if (hasUser)
            throw new BadRequestException('该部门用户,无法删除')
        return Role.destroy({where: {id}})
    }

    async verifyParentId(role: Role) {
        if (role.parentId && role.parentId !== '0') {
            const parent: Role = await Role.findByPk(role.parentId)
            if (parent) {
                role.rootDeptId = parent.rootDeptId
                if (parent.rootId != '0')
                    role.rootId = parent.rootId
                else
                    role.rootId = parent.id
            } else
                throw new BadRequestException('error parentId')
        }
    }

    async listUser(roleId: string, pageQueryVo: PageQueryVo) {
        return User.findAndCountAll({
            include: [{
                model: Role,
                where: {id: roleId},
                required: true
            }],
            offset: pageQueryVo.offset(),
            limit: pageQueryVo.limit(),
            attributes: {exclude: ['pwd']}
        })
    }

    async updateAssociation(userIds: string, roleId: string) {
        return Role.sequelize.transaction(t => {
            const ids = userIds.split(',')
            return RoleUser.findAll({
                where: {
                    userId: {[Op.in]: ids},
                    roleId
                }
            }).then((res: RoleUser[]) => {
                const hasIds = res.map((r) => r.userId)
                const add = ids.filter((id) => !hasIds.includes(id))
                if (ArrayUtil.isNotNull(add))
                    return RoleUser.bulkCreate(add.map((s) => {
                        return {userId: s, roleId}
                    }))
                return
            })
        })

    }

    async deleteAssociation(roleId: string, userIds: string) {
        return RoleUser.destroy({
            where: {
                roleId, userId: {[Op.in]: userIds.split(',')}
            }
        })
    }

    async childrenList(rootDeptId: string, parentId: string) {
        if (rootDeptId && !parentId)
            return Role.findAll({where: {rootDeptId, parentId: '0'}})
        if (parentId)
            return Role.findAll({where: {parentId}})
    }
}
