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
import User from "./User.entity";
import DeptUsersEntity from "./dept.users.entity";
import RoleUser from "./role.user.entity";

@Table({

    timestamps: true,
    underscored: true,
})

export default class SysRole extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV4,
    })
    id: string;

    @Column
    name: string
}
