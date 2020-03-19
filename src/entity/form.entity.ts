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
import {ThemeInterface} from "./JSONDataInterface/theme.interface";
import {LabelInterface} from "./JSONDataInterface/label.interface";
import {FormItemInterface} from "./JSONDataInterface/FormItem.interface";

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
    hasCache: boolean

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
    theme: ThemeInterface
    @Column({
        type:DataType.JSONB
    })
    label: LabelInterface

    @Column({
        type:DataType.JSONB
    })
    items: FormItemInterface[];



}
