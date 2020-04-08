
import {BelongsTo, Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table} from "sequelize-typescript";
import Form from "./form.entity";
import {ApiHideProperty} from "@nestjs/swagger";
import ProcedureNode from "./procedure.node.entity";
import {FlowModelInterface} from "./JSONDataInterface/flow.model.interface";
import ProcedureEdge from "./procedure.edge.entity";

@Table({

    timestamps: true,
    underscored: true,
})

export default class Procedure  extends  Model{

    @PrimaryKey
    @Column({
        type:DataType.UUID,
        defaultValue:DataType.UUIDV4
    })
    id: string

    @Column
    status: '1'|'2'
    @Column
    name: string
    @Column({
        type:DataType.JSONB
    })
    flowModel :FlowModelInterface

    @ApiHideProperty()
    @BelongsTo(()=>Form)
    form:Form
    @ForeignKey(()=>Form)
    formId: string

    @HasMany(()=>ProcedureNode)
    nodes: ProcedureNode[]

    @HasMany(()=>ProcedureEdge)
    edges: ProcedureEdge[]

}
