import {BelongsTo, BelongsToMany, Column, ForeignKey, HasMany, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV4} from "sequelize";
import User from "./User.entity";
import App from "./App.entity";
import UserTeam from "./user.team.entity";
import {ApiHideProperty} from "@nestjs/swagger";

@Table
export default class Team extends Model {
    @PrimaryKey
    @Column({
        defaultValue: UUIDV4
    })
    id: string

    // @ForeignKey()
    // ownerId: string
    @Column
    name: string

    @HasMany(() => App)
    @ApiHideProperty()
    apps: App[]

    @BelongsToMany(() => User, () => UserTeam)
    @ApiHideProperty()
    member: User[]
}
