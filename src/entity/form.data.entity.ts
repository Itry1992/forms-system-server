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

    @Column
    suggest?: string

    @Column
    handWritten?: string

    @CreatedAt
    createTime: Date

    @Column
    crateIp: string

    @Column
    createUserId: string

    @Column
    submitUserId: string

    @Column
    // 一个节点只有一条数据
    currentProcedureNodeId: string


    @Column
    dataGroup: string

    @Column
    endData: 'start'|'end'|'task'


}
