import {Column, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV4} from "sequelize";
import Dept from "./Dept.entity";
import User from "./User.entity";

@Table
export default class DeptUsersEntity  extends Model{
    @PrimaryKey
    @Column({
        defaultValue:UUIDV4
    })
    id:string

    @ForeignKey(()=>Dept)
    deptId: string

    @ForeignKey(()=>User)
    userId: string
}
