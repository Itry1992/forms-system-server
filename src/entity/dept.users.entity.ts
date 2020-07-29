import {Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV4} from "sequelize";
import Dept from "./Dept.entity";
import User from "./User.entity";

@Table
export default class DeptUsersEntity  extends Model{

    @ForeignKey(()=>Dept)
    deptId: string

    @ForeignKey(()=>User)
    userId: string
}
