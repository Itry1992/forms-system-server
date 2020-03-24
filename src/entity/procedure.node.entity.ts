import {BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {FiledPermissionInterface} from "./JSONDataInterface/filedPermission.interface";
import Procedure from "./procedure.entity";


@Table({
    timestamps: true,
    underscored: true,
})
export default class ProcedureNode extends Model {

    @PrimaryKey
    @Column({
        defaultValue: DataType.UUIDV4
    })
    id: string
    @Column
    name: string
    @Column
    positionX: number
    @Column
    positionY: number

    @Column({
        type: DataType.JSONB
    })
    filedPermissions: FiledPermissionInterface[]
    @Column({
        defaultValue: '##@0##defualt',
        comment: '当位默认值时候未启用'
    })
    submitButton: string
    @Column({
        defaultValue: '##@0##defualt',
    })
        //暂存按钮
    stagingButton: string
    @Column({
        defaultValue: '##@0##defualt'
    })
    endButton: string
    @Column({
        defaultValue: '##@0##defualt'
    })
    submitAddPrint: string

    @ForeignKey(() => Procedure)
    procedureId: string

    @BelongsTo(() => Procedure)
    procedure: Procedure


}
