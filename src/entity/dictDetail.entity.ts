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
import Dict from "./dict.entity";

@Table({

    timestamps: true,
    underscored: true,
})

export default class DictDetail extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV4,
    })
    id: string;

    @Column
    name: string

    @Column
    value: string

    @ForeignKey(() => Dict)
    dictId: string
    @ApiHideProperty()
    @BelongsTo(() => Dict)
    dict: Dict



}
