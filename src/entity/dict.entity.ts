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
import DictDetail from "./dictDetail.entity";

@Table({
    // tableName:'newuser',
    timestamps: true,
    // freezeTableName:true,
    underscored: true,
})

export default class Dict extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV4,
    })
    id: string;

    @Column
    name: string

    @Column
    remark: string

    @HasMany(() => DictDetail)
    dictDetail: DictDetail


}
