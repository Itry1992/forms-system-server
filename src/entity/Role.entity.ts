import {
    Table,
    Column,
    Model,
    PrimaryKey,
    BelongsToMany,
    DataType,
} from 'sequelize-typescript';

import {UUIDV4} from 'sequelize';
import {ApiHideProperty, ApiProperty} from "@nestjs/swagger";
import User from "./User.entity";
import RoleUser from "./role.user.entity";
import {FormItemInterface} from "./JSONDataInterface/FormItem.interface";


@Table({
    timestamps: true,
    underscored: true,
})

export default class Role extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV4,
    })
    id: string;

    @Column
    name: string
    @Column
    description: string
    @Column({defaultValue: '0'})
    parentId: string
    @Column({defaultValue: '0'})
    rootId: string

    @Column({defaultValue:false})
    signAbel: boolean
    @Column({defaultValue:false})
    checkAbel: boolean

    @Column
    rootDeptId: string

    @Column({type: DataType.JSONB})
    items: FormItemInterface[]

    @ApiHideProperty()
    @BelongsToMany(() => User, () => RoleUser)
    users: User[]


}
