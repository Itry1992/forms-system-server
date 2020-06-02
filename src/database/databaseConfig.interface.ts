import { Options } from 'sequelize';
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
        host: '120.79.12.65',
        port: 5432,
        username: 'postgres',
        password: 'admin',
        database: 'form-data',
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
