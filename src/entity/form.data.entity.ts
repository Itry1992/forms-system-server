import {BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV4} from "sequelize";
import Form from "./form.entity";
import {ApiHideProperty} from "@nestjs/swagger";
import ProcedureNode from "./procedure.node.entity";


@Table({
    timestamps: true,
    underscored: true
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

    @Column({
        type: DataType.JSONB
    })
    handWritten?: { uid: string, url: string, status: string }

    @CreatedAt
    createTime: Date

    @Column
    crateIp: string

    @Column
    createUserId: string

    @Column
    createUserName: string

    @Column
    submitUserId: string

    @Column
    submitUserName: string

    @ForeignKey(() => ProcedureNode)
        // 一个节点只有一条数据
    currentProcedureNodeId: string

    @BelongsTo(() => ProcedureNode)
    currentProcedureNode: ProcedureNode


    @Column
    todoId: string

    @Column
    dataGroup: string

    @Column
        //改组数据状态 1处理中 2处理完成
    dataGroupStatus: string

    @Column
    endData: 'start' | 'end' | 'task'

    @Column({
        type: DataType.JSONB
    })
    briefData: any


}
