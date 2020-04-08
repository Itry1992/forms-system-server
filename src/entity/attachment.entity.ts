import {Column, CreatedAt, Model, Table} from 'sequelize-typescript';
import {UUIDV1, UUIDV4} from 'sequelize';
@Table({
    underscored:true,
    timestamps:true
})
export  default class Attachment extends Model {
    @Column({
        defaultValue:UUIDV1,
        primaryKey:true
    })
    id: string;
    @Column
    localPath: string;
    @Column
    originalName: string;
    @Column({
        comment:'kb',
    })
    size: number;
    @Column
    fileType: string;

    @Column({
        defaultValue:'0'
    })
    modelId: string;
    @Column
    description: string;
    @CreatedAt
    createTime: Date;

    @Column
    thumbPath: string
}
