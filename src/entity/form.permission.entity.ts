import {BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV4} from "sequelize";
import {FiledPermissionInterface} from "./JSONDataInterface/filedPermission.interface";
import Form from "./form.entity";
import {ApiOperation, ApiProperty} from "@nestjs/swagger";

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

    //可更新表单的人
    @ApiProperty({description:'可跟新的以下几个xxxxAble 均为该结构  数据结构 { deptIds: string[], roleIds: string[], userIds: string[] } '})
    @Column({type: DataType.JSONB})
    updateAble: { deptIds: string[], roleIds: string[], userIds: string[] }
    //可查看表单的人
    @Column({type: DataType.JSONB})
    showAble: { deptIds: string [], roleIds: string[], userIds: string[] }
    //可删除表单的人
    @Column({type: DataType.JSONB})
    deleteAble: { deptIds: string [], roleIds: string[], userIds: string[] }
    //可导入数据的账号
    @Column({type: DataType.JSONB})
    importAble: { deptIds: string[], roleIds: string, userIds: string }

    @ForeignKey(() => Form)
    formId: string
    @BelongsTo(() => Form)
    form: Form
}
