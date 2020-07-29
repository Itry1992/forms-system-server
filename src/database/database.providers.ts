import {Sequelize} from 'sequelize-typescript';
import {databaseConfig} from './databaseConfig.interface';
import * as path from 'path';
import * as cls from 'cls-hooked';
import User from "../entity/User.entity";
import Role from "../entity/Role.entity";
import Form from "../entity/form.entity";
import ProcedureNode from "../entity/procedure.node.entity";
import FormData from "../entity/form.data.entity";
import FormTodo from "../entity/form.todo.entity";
import FormDataAttach from "../entity/form.data.attach.entity";


export const databaseProviders = {
    provide: 'SEQUELIZE',
    useFactory: async () => {
        const namespace = cls.createNamespace('my-sequelize-namespace');
        Sequelize.useCLS(namespace)
        const isProduction = process.env.NODE_ENV === 'pro';
        console.log('isProduction',isProduction)
        const sequelize = new Sequelize(isProduction ? databaseConfig.production : databaseConfig.development);
        // const sequelize = new Sequelize(databaseConfig.production);
        sequelize.addModels([path.resolve(__dirname, '..') + '/**/*.entity{.ts,.js}']);
        sequelize.authenticate().then(() => {
            console.log('数据库连接成功.')
        })
            .catch((err: any) => {

                console.error('数据库连接失败:', err)
            });
        if (isProduction)
            await sequelize.sync({alter: true});
        // FormDataAttach.sync({alter:true})
        return sequelize;
    }
}
