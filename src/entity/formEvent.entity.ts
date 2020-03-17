import {BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import Form from "./form.entity";

@Table({
    timestamps: true,
    underscored: true,
})
export  default class FormEvent extends Model {
    @PrimaryKey
    @Column({
        defaultValue:DataType.UUIDV4,
        type:DataType.UUID
    })
    id: string

    @Column
    name: string
    @Column
    description:string
    @Column
    eventField: string

    @Column
    requestMethod: string
    @Column
    requestUrl: string

    @Column
    status: string

    @ForeignKey(()=>Form)
    formId: string
    @BelongsTo(()=>Form)
    form:Form

}
