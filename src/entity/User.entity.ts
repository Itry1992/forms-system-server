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
    eMail: string
    @Column
    weChartId:string


}
