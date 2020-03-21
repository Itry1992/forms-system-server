import {Module} from "@nestjs/common";
import {UserController} from "./controller/user.controller";
import {UserService} from "./service/user.service";
import {DictController} from "./controller/dict.controller";
import {DictService} from "./service/dict.service";
import {DeptController} from "./controller/dept.controller";
import {DeptService} from "./service/dept.service";
import {SysAppService} from "./service/sysApp.service";
import {AppController} from "./controller/app.controller";
import {TeamService} from "./service/team.service";
import {UserDeptController} from "./controller/user.dept.controller";
import {FormController} from "./controller/form.controller";
import {FormService} from "./service/form.service";


@Module({
    controllers:[UserController,DictController,UserDeptController,DeptController,FormController],
    providers:[UserService,DictService,DeptService,SysAppService,TeamService,FormService]
})
export class SystemModule {
}
