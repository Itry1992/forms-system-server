import {Column, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV4} from "sequelize";
import User from "./User.entity";
import Role from "./Role.entity";

@Table
export default class RoleUser  extends Model{
    @PrimaryKey
    @Column({
        defaultValue:UUIDV4
    })
    id:string

    @ForeignKey(()=>Role)
    roleId: string

    @ForeignKey(()=>User)
    userId: string
}
