import {BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV4} from "sequelize";
import Form from "./form.entity";
import {ApiHideProperty} from "@nestjs/swagger";

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

    @ApiHideProperty()
    @BelongsTo(() => Form)
    form: Form

    @Column({
        type: DataType.JSONB
    })
    data: any

    @CreatedAt
    createTime: Date

    @Column
    submitIp: string

    @Column
    submitUserId: string

    @Column
    currentProcedureNodeIds: string


}
