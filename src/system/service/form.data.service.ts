import {Injectable} from "@nestjs/common";
import {PageQueryVo} from "../../common/pageQuery.vo";
import FormData from "../../entity/form.data.entity";

@Injectable()
export class FormDataService {

    async list(pageQueryVo: PageQueryVo, formId: string) {
        return FormData.findAndCountAll({
            where: {formId},
            limit: pageQueryVo.getSize(),
            offset: pageQueryVo.offset()
        })
    }

    async add(data: any, formId: string, ip: string) {
        return FormData.create({data,formId,submitIp:ip})
    }

    async update(data: any,id: string) {
        return  FormData.update({data},{
            where:{id}
        })
    }
}
