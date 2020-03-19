import {Column, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV4} from "sequelize";

@Table({
    timestamps: true
})
export default class LogRequest extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV4
    })
    id: string
    @Column
    ip: string
    @Column
    baseUrl: string
    @Column
    data: string
}
