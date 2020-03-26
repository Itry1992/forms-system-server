import {Injectable} from "@nestjs/common";
import FormPermission from "../../entity/form.permission.entity";
import {ResponseUtil} from "../../common/response.util";

@Injectable()
export class FormPermissionService {
    async findByFormId(id: string) {
        return FormPermission.findOne({
            where:{
                formId: id
            }
        })
    }

    async upsert(formPermission:FormPermission) {
        if (formPermission.id) {
           const dbEntity =await  FormPermission.findByPk(formPermission.id)
            if (!dbEntity)
                return  ResponseUtil.error('illegal id , no entity in database')
        }
        return FormPermission.upsert(formPermission)
    }
}
