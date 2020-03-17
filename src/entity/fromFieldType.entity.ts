import {Column, DataType, Model, PrimaryKey} from "sequelize-typescript";
import {UUIDV4} from "sequelize";
import {Col} from "sequelize/types/lib/utils";
import {ProcedureNodeOptionsInterface} from "./JSONDataInterface/procedureNodeOptions.interface";

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
