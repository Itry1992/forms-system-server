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
import Dept from "./Dept.entity";


@Table({

    timestamps: true,

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

    @Column
    submitRule?: number;

    @Column
    mobileLayout?: 'compact' | 'normal';
    @Column
    pcLayout?: 'normal' | 'grid-2';

    @Column({
        type: DataType.JSONB
    })
    unVisibleData: object[];

    @Column({
        type: DataType.JSONB
    })
    theme: ThemeInterface

    @Column({
        type: DataType.JSONB
    })
    tabs: LabelInterface

    @Column({
        type: DataType.JSONB
    })
    items: FormItemInterface[];


    @ForeignKey(() => Dept)
    deptId: string

    @BelongsTo(() => Dept)
    dept: Dept


}
