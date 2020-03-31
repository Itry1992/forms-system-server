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
import App from "./App.entity";


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

    @Column({
        defaultValue: '0'
    })
    parentId: string

    @Column
    rootId: string

    @Column
    hasChildren: boolean

    @ApiHideProperty()
    @BelongsToMany(() => User, () => DeptUsersEntity)
    users: User[]

    @ApiHideProperty()
    @BelongsTo(() => App)
    app: App

    @ApiHideProperty()
    @ForeignKey(() => App)
    appId: string


}
