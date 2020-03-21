
import {Column, DataType, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV4} from "sequelize";
import {ProcedureNodeOptionsInterface} from "./JSONDataInterface/procedureNodeOptions.interface";
@Table({
    timestamps:true,
    underscored:true
})

export default class FromFieldType extends Model{
    @PrimaryKey
    @Column({
        defaultValue:UUIDV4
    })
    id: string

    @Column
    name: string

    @Column({
        type:DataType.JSONB
    })
    procedureNodeOptions:ProcedureNodeOptionsInterface[]
}
