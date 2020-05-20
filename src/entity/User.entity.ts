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
import {ApiHideProperty, ApiProperty} from "@nestjs/swagger";
import Role from "./Role.entity";
import RoleUser from "./role.user.entity";
import Dept from "./Dept.entity";
import DeptUsersEntity from "./dept.users.entity";
import SysRole from "./sys.role.entity";


@Table({
    timestamps: true,
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

    @Column({unique: true})
    account: string

    @Column
    name: string

    @Column
    eMail: string
    @Column
    weChartId: string

    @Column({
        defaultValue: '0'
    })
    status: string

    @ApiHideProperty()
    @BelongsToMany(() => Role, () => RoleUser)
    roles: Role[]

    @ApiHideProperty()
    @BelongsToMany(() => Dept, () => DeptUsersEntity)
    depts: Dept[]

    @Column({type: DataType.JSONB})
    registerData: any

    @ForeignKey(() => SysRole)
    sysRoleId: string
    @ApiHideProperty()
    @BelongsTo(() => SysRole)
    sysRole: SysRole

    @Column
    rootDeptId: string
    @Column
    signTime: Date

}
