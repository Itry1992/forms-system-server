import {BadRequestException, Injectable} from "@nestjs/common";
import {PageQueryVo} from "../../common/pageQuery.vo";
import User from "../../entity/User.entity";
import {Op} from "sequelize";
import {ResponseUtil} from "../../common/response.util";
import SysRole from "../../entity/sys.role.entity";
import DeptUsersEntity from "../../entity/dept.users.entity";
import {ArrayUtil} from "../../common/util/array.util";

@Injectable()
export class UserService {

    list(pageVo: PageQueryVo, name?: string, deptId?: string) {
        const whereOpt: any = {}
        if (name)
            whereOpt.name = {[Op.like]: `%${name}%`}
        const include = []
        include.push({
            model: SysRole
        })
        if (deptId) {
            include.push({
                association: 'depts',
                where: {id: deptId}
            })
        }
        return User.findAndCountAll({
            where: whereOpt,
            limit: pageVo.getSize(),
            offset: pageVo.offset(),
            include: include
        }).then(res => {
            return ResponseUtil.page(res)
        });
    }

    create(user: User) {
        return User.create(user).then(res => {
            return ResponseUtil.success(res)
        });
    }

    update(user: User) {
        return User.update(user, {
            where: {id: user.id}
        }).then(res => {
            return ResponseUtil.success(res)
        });
    }

    delete(id: string) {
        return User.destroy({
            where: {
                id
            }
        }).then(res => {
            return ResponseUtil.success(res)
        });
    }

    async createWithDept(user: User, deptId: string) {
        return User.sequelize.transaction(t => {
            return User.create(user).then((res) => {
                return DeptUsersEntity.create({userId: res.id, deptId}).then(() => {
                    return res
                })
            })
        })
    }

    async deleteAssociation(userId: string, deptId?: string) {
        // return
    }

    async updateAssociation(userId: string, newDeptId: string, rootDeptId: string) {
        return DeptUsersEntity.sequelize.transaction(t => {
            return DeptUsersEntity.destroy({
                    where: {userId}
                }
            ).then(() => {
                return Promise.all([
                    DeptUsersEntity.create({userId, deptId: newDeptId}),
                    User.update({rootDeptId}, {where: {id: userId}})
                ])
            })
        })
    }

    async bulkDeleteAssociation(userIds: string) {
        //被删除的人员会被自动归属到 顶级部门
        const firstUser: User = await User.findByPk(userIds.split(',')[0])
        if (!firstUser) {
            throw new BadRequestException('用户不存在')
        }
        return DeptUsersEntity.update({deptId: firstUser.rootDeptId}, {
            where: {
                userId: {[Op.in]: userIds.split(',')}
            }
        })
    }

    async all() {
        return User.findAll()
    }

    async bulkAddAssociation(userIds: string, targetDeptId: string, rootDeptId: string) {
        return DeptUsersEntity.sequelize.transaction(t => {
            return DeptUsersEntity.destroy({
                where: {userId: {[Op.in]: userIds.split(',')}}
            }).then(res => {
                const data: { userId: string, deptId: string }[] = []
                userIds.split(',').forEach(userId => {
                    data.push({
                        userId, deptId: targetDeptId
                    })
                })
                return Promise.all([
                    DeptUsersEntity.bulkCreate(data),
                    User.update({rootDeptId}, {
                        where: {id: {[Op.in]: userIds.split(',')}}
                    })
                ])
                return res
            })
        })
    }
}
