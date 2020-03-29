import {Column, DataType, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV1} from "sequelize";

@Table({
    timestamps: true,
    underscored: true
})
export default class FormComment extends Model {

    @PrimaryKey
    @Column({
        defaultValue: UUIDV1
    })
    id: string


    @Column({
        type: DataType.STRING(1000)
    })
    value: string
    @Column
    createUserId: string
    @Column
    createUserName: string

    @Column
    formId: string

    @Column
    groupId: string
}
