import {Column, DataType, Model, PrimaryKey, Table} from "sequelize-typescript";
import {UUIDV1} from "sequelize";
@Table({
    underscored:true
})
export default class Theme  extends Model{
    @PrimaryKey
    @Column({
        defaultValue:UUIDV1
    })
    id: string
    @Column
    name: string

    @Column({
        type:DataType.JSONB
    })
    title: {
        textAlign: string;
        fontSize: number;
        fontStyle: string;
        fontWeight: string;
        color: string;
    };
    @Column({
        type:DataType.JSONB
    })
    background: { mode: 'color' | 'image'; color: string; image: string };
    @Column({
        type:DataType.JSONB
    })
    banner: {
        mode: 'image' | 'color';
        image: string;
        color: string;
    };
    @Column({
        type:DataType.JSONB
    })
    submit_btn: { backgroundColor: string };
}
