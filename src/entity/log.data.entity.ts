import {BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV4} from "sequelize";
import User from "./User.entity";
import FormData from "./form.data.entity";

@Table({
    underscored: true,
    timestamps: true
})
export default class LogData extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV4
    })
    id: string

    @ForeignKey(() => User)
    operatorId: string

    @BelongsTo(()=>User)
    operator: User

    @ForeignKey(() => FormData)
    formDataId: string

    @BelongsTo(()=>FormData)
    formData: FormData

    @Column
    action: 'create'|'update'|'delete'

    
}
