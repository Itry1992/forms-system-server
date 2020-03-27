import {BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV1} from "sequelize";
import ProcedureEdge from "./procedure.edge.entity";
import {Col} from "sequelize/types/lib/utils";

@Table({
    underscored: true,
    timestamps: true
})
export default class FormTodo extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV1
    })
    id: string

    @Column
    type: string

    @Column({
        type: DataType.ARRAY(DataType.STRING)
    })
    targetUserId: string[]

    @Column({
        type: DataType.ARRAY(DataType.STRING)
    })
    targetDeptId: string[]

    @Column
    dealUserId: string

    @Column
    formId: string

    @Column
    preTodoId: string

    @Column
    formDataGroup: string

    @ForeignKey(() => ProcedureEdge)
    edgeId: string

    @BelongsTo(() => ProcedureEdge)
    edge: ProcedureEdge

    // action: string
    @Column
    actionUrl: string

    @Column({
        type: DataType.JSONB
    })
    briefData: any

    @Column
    nodeName: string

    @Column
    formTitle: string

    @Column
    createUser: string
    @Column
    status: '1' | '2'

    // @CreatedAt
    // createdAt : Date
}
