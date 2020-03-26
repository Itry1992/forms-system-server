import {BelongsTo, Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table} from "sequelize-typescript";
import {FiledPermissionInterface} from "./JSONDataInterface/filedPermission.interface";
import Procedure from "./procedure.entity";
import ProcedureEdge from "./procedure.edge.entity";
import {UUIDV1} from "sequelize";
import {ApiHideProperty} from "@nestjs/swagger";

interface i {
    id: string,
    visible: boolean
    edit:boolean
}

@Table({
    timestamps: true,
    underscored: true,
})
export default class ProcedureNode extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV1
    })
    id: string


    @Column
    name: string
    @Column
    x: number
    @Column
    y: number
    @Column
    shape: "start-node" | "user-task-node" | 'end-node' | 'receive-task-node';

    @Column
    label: string;//text;
    @Column
    clazz: 'start'|'end'|'userTask'|'receiveTask'

    @Column
    dueDate: string

    @Column({
        type: DataType.ARRAY(DataType.BIGINT)
    })
    size: [number, number]; //宽高

    @Column
    assignType?: string; //审批类型  person 人员，
    @Column({
        type: DataType.ARRAY(DataType.STRING)
    })
    assignPerson?: string[]; //审批人员 id
    @Column({
        type: DataType.ARRAY(DataType.STRING)
    })
    assignDept?: string[]; //审批部门 id

    @Column({
        type: DataType.ARRAY(DataType.STRING)
    })
    letter?: string[]; //"itemId:{brief}" brief 简报；editable 编辑 visible 可见
    // itemId:brief,
    // a:c

    @Column
    suggest?: boolean;//文本意见;
    @Column
    handWritten?: boolean;//手写签名；
    @Column
    submit?: boolean;//提交;
    @Column
    submitWithPrint?: boolean;//提交并打印
    @Column
    refuse?: boolean;//退回
    @Column
    forward?: true;//转交
    @Column
    endable?: boolean;//结束流程
    @Column
    bluksubmit?: boolean;//批量提交

    @ForeignKey(() => Procedure)
    procedureId: string

    @BelongsTo(() => Procedure)
    procedure: Procedure

    @HasMany(() => ProcedureEdge)
    nextEdge: ProcedureEdge[]


}
