import {Injectable} from "@nestjs/common";
import * as fs from "fs";
import xlsx from 'node-xlsx';
import Form from "../../entity/form.entity";
import FormData from "../../entity/form.data.entity";
import {FormExportDto} from "../dto/form.export.dto";
import * as uuid from 'node-uuid';
import {FileUpLoadUrl} from "../../common/file.upload.url";
import {ArrayUtil} from "../../common/util/array.util";

@Injectable()
export class XlsxService {
    async export(datas: FormData[],form: Form, formExportDto: FormExportDto) {
        let itemIds  = formExportDto.itemIds
        if (ArrayUtil.isNull(formExportDto.itemIds))
            itemIds = []
        if (!fs.existsSync(FileUpLoadUrl.url+'/xlsx')) {
            await fs.mkdirSync(FileUpLoadUrl.url+'/xlsx');
        }
        const headData = itemIds.map((s)=>{
            return form.items.find((i)=>{
                return i.id =  s
            })?.title
        })
        if (formExportDto.createTime)
            headData.push('首次提交时间')
        if (formExportDto.createUser)
            headData.push('首次提交人')
        if (formExportDto.produceNodeEndTime)
            headData.push('审核完成时间')
        const xlsxData = datas.map((d) => {
            const rowData =  itemIds.map((id)=> {
                if (!d.data[id])
                    return  ''
                // if (typeof d.data[id] === "string")
                //     return d.data[id]
                // else
                // {
                //     try {
                //         return JSON.stringify(d.data[id])
                //     } catch (e) {
                //
                //     }
                // }
                return  d.data[id]

            })
            if (formExportDto.createTime)
                rowData.push(d.createTime)
            if (formExportDto.createUser)
                rowData.push(d.createUserName || '-')
            if (formExportDto.produceNodeEndTime)
                rowData.push(d.updatedAt)
            return rowData
        })
        const buffer = xlsx.build([{name: form.name, data: [headData,...xlsxData ]}]);

        const r = uuid.v1();
        const  filePath = FileUpLoadUrl.url+'/xlsx/' + r + '.xlsx'
        await fs.writeFileSync(filePath, buffer, {flag: 'w'});
        return filePath
    }
}
