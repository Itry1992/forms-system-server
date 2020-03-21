
import {Sequelize} from 'sequelize-typescript';
import {databaseConfig} from './databaseConfig.interface';
import * as path from 'path';
import * as cls from 'cls-hooked';


export const databaseProviders = {
    provide: 'SEQUELIZE',
    useFactory: async () => {
        const namespace = cls.createNamespace('my-sequelize-namespace');
        Sequelize.useCLS(namespace)
        // const dev = process.env.NODE_ENV !== 'production';
        const sequelize = new Sequelize(databaseConfig.production);

        sequelize.addModels([path.resolve(__dirname, '..') + '/**/*.entity{.ts,.js}']);
        sequelize.authenticate().then(() => {
            console.log('数据库连接成功.')
        })
            .catch((err: any) => {

                console.error('数据库连接失败:', err)
            });
        await sequelize.sync();
        return sequelize;
    }
}
