import {BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV1} from "sequelize";
import ProcedureEdge from "./procedure.edge.entity";
import {Col} from "sequelize/types/lib/utils";
import Form from "./form.entity";
import {ApiHideProperty} from "@nestjs/swagger";

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

    @Column({
        type: DataType.ARRAY(DataType.STRING)
    })
    targetRoleId: string[]

    @Column({
        type: DataType.ARRAY(DataType.STRING)
    })
    targetDeptIdWhitRole: string[]

    @Column({defaultValue: 'any'})
    submitRule?: 'any' | 'all'

    @Column
    signGroup: string

    @Column({type: DataType.ARRAY(DataType.JSONB)})
    submitters: { id: string, name: string, submitTime: string, handSign: { uid: string, url: string, status: string } }[]
    @Column({type: DataType.ARRAY(DataType.STRING)})
    submitterId: string[]
    @Column({defaultValue: false})
    onlySigned: boolean
    @Column
    dealUserId: string

    @ForeignKey(() => Form)
    formId: string

    @BelongsTo(() => Form)
    @ApiHideProperty()
    form: Form

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
    createUserId: string

    @Column
        //1 未处理 2已处理 3已经到达end节点
    status: '1' | '2' | '3'

}
