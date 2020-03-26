import {BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV1} from "sequelize";
import ProcedureEdge from "./procedure.edge.entity";

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

    @Column
    status: '1'|'2'
}
