import {BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import Form from "./form.entity";
import {ApiHideProperty} from "@nestjs/swagger";

@Table({

    timestamps: true,
    underscored: true,
})
export default class Procedure  extends  Model{

    @PrimaryKey
    @Column({
        type:DataType.UUID,
        defaultValue:DataType.UUIDV4
    })
    id: string

    @Column
    status: string
    @Column
    name: string
    @Column
    remindMethod: string
    @Column
    withdrawAble: boolean
    @Column
    showLogAble: boolean
    @Column
    submitRule: string

    @ApiHideProperty()
    @BelongsTo(()=>Form)
    form:Form
    @ForeignKey(()=>Form)
    formId: string

}
