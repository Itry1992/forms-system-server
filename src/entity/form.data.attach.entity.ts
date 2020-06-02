import {BelongsTo, Column, DataType, ForeignKey, Model, Table} from "sequelize-typescript";
import {UUIDV1} from "sequelize";
import FormData from "./form.data.entity";

@Table
export default class FormDataAttach extends Model {
    @Column({primaryKey: true, defaultValue: UUIDV1})
    id: string
    @BelongsTo(() => FormData)
    formData: FormData
    @ForeignKey(() => FormData)
    formDataId: string
    // @Column
    // formId: string

    @Column
    checkUserId: string
    @Column
    checkUserName: string

    @Column({type: DataType.JSONB})
    extra: any
}
