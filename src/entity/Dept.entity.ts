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

@Table({
    timestamps: true,
    // freezeTableName:true,
    underscored: true,
})

export default class Dept extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV4,
    })
    public id: string;

    @Column
    name: string

    @Column
    parentId: string

    @ApiHideProperty()
    @BelongsToMany(() => User, () => DeptUsersEntity)
    users: User[]


}
