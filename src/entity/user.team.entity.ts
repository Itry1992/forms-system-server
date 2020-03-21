import {Column, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import Team from "./team.entity";
import User from "./User.entity";
import {UUIDV1} from "sequelize";

@Table
export default class UserTeam extends Model {
    @PrimaryKey
    @Column({
        defaultValue:UUIDV1
    })
    id: string
    @ForeignKey(() => Team)
    teamId: string
    @ForeignKey(() => User)
    userId: string

    @Column
    typeof:'member'|'owner'
}
