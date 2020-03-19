import {BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV4} from "sequelize";
import Form from "./form.entity";

@Table({
    timestamps: true,
    freezeTableName: true
})
export default class FormData extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV4
    })
    id: string

    @ForeignKey(() => Form)
    formId: string

    @BelongsTo(()=>Form)
    form: Form

    @Column({
        type:DataType.JSONB
    })
    data: any

    @Column
    currentProcedureNodeIds: string



}
