import { Options } from 'sequelize';
export interface IDatabaseOptions {
    development: Options,
    production: Options,
}
export const databaseConfig: IDatabaseOptions = {
    development: {
        dialect: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'user1',
        password: '123qwe',
        database: 'huzhan',
        timezone: '+08:00',
        dialectOptions: {
            dateStrings: true,
            typeCast:  (field: any, next: any) => { // for reading from database
                if (field.type === 'DATETIME') {
                    return field.string()
                }
                return next()
            },
        },
    },
    production: {
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'admin',
        database: 'huzhan',
        timezone: '+08:00',
        dialectOptions: {
            dateStrings: true,
            typeCast:  (field: any, next: any) => { // for reading from database
                if (field.type === 'DATETIME') {
                    return field.string()
                }
                return next()
            },
        },
    },
}
