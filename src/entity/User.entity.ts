import {
    Table,
    Column,
    Model,
    HasMany,
    PrimaryKey,
    Default,
    BelongsToMany,
    DataType,
    ForeignKey, BelongsTo
} from 'sequelize-typescript';

import {UUIDV4} from 'sequelize';
import {ApiHideProperty} from "@nestjs/swagger";
import Role from "./Role.entity";
import RoleUser from "./role.user.entity";
import {RpcArgumentsHost} from "@nestjs/common/interfaces";
import Dept from "./Dept.entity";
import DeptUsersEntity from "./dept.users.entity";

@Table({
    // tableName:'newuser',
    timestamps: true,
    // freezeTableName:true,
    underscored: true,
})

export default class User extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV4,
    })
    public id: string;

    @Column
    pwd: string;
    @Column
    account: string

    @Column
    name: string

    @Column
    eMail: string
    @Column
    weChartId:string

    @ApiHideProperty()
    @BelongsToMany(()=>Role, ()=>RoleUser)
    roles: Role[]

    @ApiHideProperty()
    @BelongsToMany(()=>Dept, ()=>DeptUsersEntity)
    depts: Dept[]

}
