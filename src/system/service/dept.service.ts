import {BadRequestException, Injectable, UnauthorizedException} from "@nestjs/common";
import {PageQueryVo} from "../../common/pageQuery.vo";
import {Op} from "sequelize";
import {ResponseUtil} from "../../common/response.util";
import Dept from "../../entity/Dept.entity";
import {DeptTreeDto} from "../dto/dept.tree.dto";
import User from "../../entity/User.entity";

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
        if (!data.parentId || data.parentId !== '0') {
            Dept.update({hasChildren: true}, {
                where: {
                    id: data.parentId
                }
            })
        }
        return Dept.create(data);
    }

    async update(data: Dept) {
        return Dept.update(data, {
            where: {id: data.id}
        })
    }

    async delete(id: string, req?) {
        const dept = await Dept.findByPk(id)
        if (req.user.sysRoleId === '1' && dept.parentId === '0') {
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

    async findNext(deptTreeDto: DeptTreeDto) {
        const children: DeptTreeDto[] = (await Dept.findAll({
            where: {
                parentId: deptTreeDto.id
            }
        })).map((dept) => {
            return DeptTreeDto.byDept(dept)
        })
        deptTreeDto.children = children
        for (const deptDto of children) {
            if (deptDto.hasChildren) {
                await this.findNext(deptDto)
            }
        }
        return deptTreeDto
    }


    async listTree(pageQueryVo?: PageQueryVo, name?: string) {
        const data: { rows: any[]; count: number } = await this.list(pageQueryVo, name, true)
        const rows = []

        for (const dept of data.rows) {
            const row = await this.findNext(DeptTreeDto.byDept(dept))
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
        if (dept.parentId && dept.parentId !== '0') {
            const parent = await Dept.findByPk(dept.parentId)
            if (parent)
                await this.findRoot(parent)
            return dept
        }
        return  dept
    }
}
