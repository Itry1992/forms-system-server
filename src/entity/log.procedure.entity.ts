import {BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV1, UUIDV4} from "sequelize";
import User from "./User.entity";
import FormData from "./form.data.entity";
import {ApiHideProperty} from "@nestjs/swagger";
import ProcedureNode from "./procedure.node.entity";

@Table({
    timestamps: true,
    underscored: true
})
export default class LogProcedure extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV1
    })
    id: string

    @Column
    result: string

    @Column
    action: string

    @Column
    resultStatus: 'success' | 'error' | 'end' | 'reBack'

    @Column
    formId: string

    @Column
    groupId: string

    @ForeignKey(() => ProcedureNode)
    nodeId: string
    @BelongsTo(() => ProcedureNode)
    node: ProcedureNode

    @ForeignKey(() => User)
    @Column
    submitUserId: string

    @ApiHideProperty()
    @BelongsTo(() => User)
    submitUser: User
}
