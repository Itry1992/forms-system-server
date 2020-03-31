import {BelongsTo, BelongsToMany, Column, ForeignKey} from "sequelize-typescript";
import {ApiHideProperty} from "@nestjs/swagger";
import Role from "../../entity/Role.entity";
import RoleUser from "../../entity/role.user.entity";
import Dept from "../../entity/Dept.entity";
import DeptUsersEntity from "../../entity/dept.users.entity";
import SysRole from "../../entity/sys.role.entity";

export class UserCreateDto {

    pwd: string;


    account: string


    name: string


    eMail: string


    weChartId: string

    //目标部门id
    deptId?: string

    //是否是部门管理人员
    isDeptAdmin?: boolean
}
