import {BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey} from "sequelize-typescript";
import Form from "./form.entity";

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

    @BelongsTo(()=>Form)
    form:Form
    @ForeignKey(()=>Form)
    formId: string

}
