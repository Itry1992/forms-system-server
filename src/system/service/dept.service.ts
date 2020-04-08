import {BadRequestException, Injectable, UnauthorizedException} from "@nestjs/common";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {Op} from "sequelize";
import {ResponseUtil} from "../../common/response.util";
import Dept from "../../entity/Dept.entity";
import {DeptTreeDto} from "../dto/dept.tree.dto";
import User from "../../entity/User.entity";
import {UserCreateDto} from "../dto/user.create.dto";
import DeptUsersEntity from "../../entity/dept.users.entity";
import {deprecate} from "util";

@Injectable()
export class DeptService {
    async list(pageQueryVo?: PageQueryVo, name?: string, isParent?: boolean) {
        const whereOpt: any = {}
        if (name) {
            whereOpt.name = {[Op.like]: `%${name}%`}
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        if (isParent === true || isParent === 'true') {
            whereOpt.parentId = '0'
        }
        let limitAndOffset = {}
        if (pageQueryVo) {
            limitAndOffset = {
                limit: pageQueryVo.getSize(),
                offset: pageQueryVo.offset(),
            }
        }
        // console.log(typeof isParent, isParent, isParent === true, whereOpt)
        return Dept.findAndCountAll({
            ...limitAndOffset,
            where: whereOpt
        });
    }


    async create(data: Dept) {
        if (data.parentId && data.parentId !== '0') {
            //父节点 hasChildren 维护
            const dept = await Dept.findByPk(data.parentId)
            if (dept)
                if (dept.rootId && dept.rootId !== '0')
                    data.rootId = dept.rootId
                else
                    data.rootId = data.parentId
            else
                data.rootId = '0'
            Dept.update({hasChildren: true}, {
                where: {
                    id: data.parentId
                }
            })
        } else
            data.rootId = '0'
        // rootid 维护

        return Dept.create(data);
    }

    async update(data: Dept) {
        delete data.parentId
        return Dept.update(data, {
            where: {id: data.id}
        })
    }

    async delete(id: string, req?) {
        const dept = await Dept.findByPk(id)
        if (req.user.sysRoleId !== '1' && dept.parentId === '0') {
            throw  new BadRequestException('only systemAdmin can delete this dept node')
        }
        if (dept)
            return Dept.destroy({
                where: {
                    id
                }
            }).then((res) => {
                if (dept.parentId && dept.parentId !== '0') {
                    //统计被删除的元素其父元素是否还有子元素
                    const count = Dept.count({
                        where: {
                            parentId: dept.parentId
                        }
                    })//如果没有父元素
                    if (count === 0)
                        Dept.update({hasChildren: false}, {
                            where: {
                                id: dept.parentId
                            }
                        })
                }
                return res
            });

    }

    // async findNextV2(dept : Dept) {
    //
    // }

    async findNext(rootId: string): Promise<DeptTreeDto> {
        const allDept = await Dept.findAll({
            where: {
                [Op.or]: {
                    rootId,
                    id: rootId
                }
            }
        })
        return this.getTreeByData(allDept)

    }

    getTreeByData(depts: Dept[], parent?: DeptTreeDto) {
        if (!parent)
            parent = DeptTreeDto.byDept(depts.find((dept, index) => {
                return dept.parentId === null || dept.parentId === '0'
            }))
        parent.children = depts.filter((dept) => {
            return dept.parentId === parent.id
        }).map((dept) => {
            const dto = DeptTreeDto.byDept(dept)
            this.getTreeByData(depts, dto)
            return dto
        })

        return parent

    }


    async listTree(pageQueryVo?: PageQueryVo, name?: string) {
        const data: { rows: any[]; count: number } = await this.list(pageQueryVo, name, true)
        const rows = []

        for (const dept of data.rows) {
            // let rootId = dept.rootId
            // if (!dept.rootId || dept.rootId==='0')
            //     rootId = dept.id
            const row = await this.findNext(dept.id)
            rows.push(row)
        }
        // console.log('rows', rows)
        data.rows = rows
        return data
    }

    async findByUserId(userId: string) {
        return Dept.findOne({
            include: [{
                model: User,
                where: {
                    id: userId
                }
            }]
        })
    }

    async findRoot(dept: Dept) {
        //
        // if (dept.parentId && dept.parentId !== '0') {
        //     const parent = await Dept.findByPk(dept.parentId)
        //     if (parent)
        //         await this.findRoot(parent)
        //     return dept
        // }
        // return dept
        if (!dept.rootId || dept.rootId === '0') {
            return dept
        } else
            return Dept.findByPk(dept.rootId)
    }

    createWithDept(userCreateDto: UserCreateDto, rootDept: Dept) {
        const deptId = userCreateDto.deptId
        let user: any = {}
        if (userCreateDto.isDeptAdmin)
            user.sysRoleId = '2'
        delete userCreateDto.isDeptAdmin
        delete userCreateDto.deptId
        user = {...user, ...userCreateDto}
        user.rootDeptId = rootDept.id
        return User.sequelize.transaction(t => {
            return User.create(user).then(res => {
                return DeptUsersEntity.create({
                    userId: res.id,
                    deptId
                }).then(() => {
                    return res
                })
            })
        })
    }

    async getIds(rootId) {
        const allDept: Dept[] = await Dept.findAll({
            where: {
                [Op.or]: {
                    rootId,
                    id: rootId
                }
            }
        })
        return allDept.map((dept) =>{
            return dept.id
        })
    }
}
