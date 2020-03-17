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
import {LayoutRuleInterface} from "./JSONDataInterface/layoutRule.interface";
import {LabelInterface} from "./JSONDataInterface/label.interface";

@Table({
    // tableName:'newuser',
    timestamps: true,
    // freezeTableName:true,
    underscored: true,
})

export default class Form extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV4,
    })
    id: string;

    @Column
    name: string

    @Column
    icon: string

    @Column
    status: string

    @Column
    type: string
    @Column
    sort: number

    @Column({
        type: DataType.JSONB
    })
    submitRule: object
    @Column
    unVisibleDataDefaultValueRule: string

    @Column({
        type: DataType.JSONB
    })
    layoutRule: LayoutRuleInterface
    @Column({
        type:DataType.JSONB
    })
    label: LabelInterface



}
