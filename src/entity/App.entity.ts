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

export default class App extends Model {
    @PrimaryKey
    @Column({
        type:DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    id: string;

    @Column
    name: string

    @Column
    userId: string



}
