import {BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV4} from "sequelize";
import User from "./User.entity";
import FormData from "./form.data.entity";

@Table({
    timestamps:true,
    underscored:true
})
export  default  class LogProcedure extends  Model{
    @PrimaryKey
    @Column({
        defaultValue: UUIDV4
    })
    id: string

    result: string

    action: string


}
