import {BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV4} from "sequelize";
import ProcedureNode from "./procedure.node.entity";
import Procedure from "./procedure.entity";

interface PointInterface {
    x: number;
    y: number;
    index: number;
}

interface ConditionsInterface {
    itemId: string; //组件id;
    title: string;//组件标题;
    type: string; //组件类型;
    value: string; //组件 formItem 的字符串对象
    list?: { label: string; value: string }[] //下拉选项;
    conditionsRule: string; //规则条件
    conditionsValue: string; //规则值
}

interface FlowInterface {
    conditiontype?: 'custom'|'else'|'undefined'; //流程规则 custom 自定义 ; else 规则如果自定义规则全部未通过 则else规则通过
    conditions?: ConditionsInterface[];
}

@Table({
    underscored: true
})
export default class ProcedureEdge extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV4
    })
    id: string
    @Column
    clazz: string;
    @ForeignKey(() => ProcedureNode)
    source: string; //ID 起点;
    @BelongsTo(() => ProcedureNode)
    sourceNode: ProcedureNode
    // @ForeignKey(() => ProcedureNode)
    @Column
    target: string; //ID 终点;
    @Column
    sourceAnchor: number; //起点的锚点序号
    @Column
    targetAnchor: number; //终点的锚点序号
    @Column
    shape: 'flow-polyline-round'; //typeof edge
    @Column({
        type: DataType.JSONB
    })
    startPoint: PointInterface;
    @Column({
        type: DataType.JSONB
    })
    endPoint: PointInterface;
    @Column({
        type: DataType.JSONB
    })
    flow: FlowInterface

    @ForeignKey(() => Procedure)
    procedureId: string
    @BelongsTo(() => Procedure)
    procedure: Procedure


}
