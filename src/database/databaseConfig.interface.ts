import { Options } from 'sequelize';
import {ConfigService} from "../common/config.service";
export interface IDatabaseOptions {
    development: Options,
    production: Options,
}
export const databaseConfig: IDatabaseOptions = {
    development: {
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'admin',
        database: 'huzhan',
        timezone: '+08:00',
        pool:{
            max:100,
            min:1
        },
    },
    production: {
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'admin',
        database: ConfigService.getField('dbName')||"form-data",
        timezone: '+08:00',
        pool:{
            max:100,
            min:1
        },
        // dialectOptions: {
        //     useUTC:false,
        //     // dateStrings: true,
        //     // typeCast:  (field: any, next: any) => { // for reading from database
        //     //     if (field.type === 'DATETIME') {
        //     //         return field.toLocaleString
        //     //     }
        //     //     return next()
        //     // },
        // },
    },
}
