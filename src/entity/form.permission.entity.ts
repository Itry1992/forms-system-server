import {BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import  {UUIDV4} from "sequelize";
import {FiledPermissionInterface} from "./JSONDataInterface/filedPermission.interface";
import Form from "./form.entity";

interface CustomPermissionInterface {
    name: string
    // 操作权限
    optPermission: string[]
    // 字段权限
    filedPermission: FiledPermissionInterface[]
}

interface MemberInterface {
    userIds?: string[]
    deptIds?: string[]
}

@Table({
    underscored: true
})
export default class FormPermission extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV4
    })
    id: string

    @Column({
        type: DataType.JSONB
    })
    custom: CustomPermissionInterface[]
    @Column({
        type: DataType.JSONB
    })
    beginFlow: MemberInterface
    @Column({
        type: DataType.JSONB
    })
    showAllFlow: MemberInterface

    @Column({
        type: DataType.JSONB
    })
    manageAllFlow: MemberInterface

    @ForeignKey(() => Form)
    formId: string

}
