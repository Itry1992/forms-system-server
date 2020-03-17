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

import {ApiHideProperty} from "@nestjs/swagger";
import {type} from "os";
import {DefaultValueInterface} from "./JSONDataInterface/defaultValue.interface";
import {SelectAbleExtraDataInterface} from "./JSONDataInterface/selectAbleExtraData.interface";
import {LocationExtraSettingInterface} from "./JSONDataInterface/locationExtraSetting.interface";
import {UUIDV4} from "sequelize";
import {AddressExtraSettingInterface} from "./JSONDataInterface/addressExtraSetting.interface";
import {RelationExtraSettingInterface} from "./JSONDataInterface/relationExtraSetting.interface";
import {UserChooseSettingInterface} from "./JSONDataInterface/userChooseSetting.interface";
import {DeptChooseSettingInterface} from "./JSONDataInterface/deptChooseSetting.interface";

@Table({
    // tableName:'newuser',
    timestamps: true,
    // freezeTableName:true,
    underscored: true,
})

export default class FormField extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV4,
    })
    id: string;

    @Column
    name: string
    @Column
    type: string
    @Column
    sort: number
    @Column
    labelName?: string
    @Column
    title: string
    @Column
    description: string;
    @Column
    formatType: string
    @Column(
        {type: DataType.JSONB}
    )
    defaultValue: DefaultValueInterface
    @Column
    verify: boolean

    @Column
    visible: boolean
    @Column
    editAble: boolean
    @Column
    layout: string
    @Column({
        type: DataType.JSONB
    })
    selectAbleExtraData?: SelectAbleExtraDataInterface

    @Column({
        type: DataType.JSONB
    })
    locationExtraSetting?: LocationExtraSettingInterface
    @Column({
        type: DataType.JSONB
    })
    addressExtraSetting?: AddressExtraSettingInterface

    @Column({
        type:DataType.JSONB
    })
    relationExtraSetting?:RelationExtraSettingInterface
    @Column
    userChooseSetting?:UserChooseSettingInterface
    @Column
    deptChooseSetting?:DeptChooseSettingInterface
    @Column
    childrenIds: string

}
