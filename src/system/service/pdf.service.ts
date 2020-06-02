import * as ejs from "ejs";
import * as qr from "qr-image";
import * as pdf from "html-pdf";
import {Injectable} from "@nestjs/common";
import Form from "../../entity/form.entity";
import FormData from "../../entity/form.data.entity";
import path from "path";
import {FormItemInterface} from "../../entity/JSONDataInterface/FormItem.interface";
import * as uuid from 'node-uuid'

@Injectable()
export class PdfService {
    async gen(form: Form, items: FormItemInterface[], data: FormData[], baseUrl: string) {
        if (!baseUrl.startsWith('http://') && ! baseUrl.startsWith('https://')){
            baseUrl = 'http://'+baseUrl
        }
        const pdfData = data.map((d) => {
            const v: any = {}
            items.forEach((i) => {
                v[i.id] = d.data[i.id]
            })
            const url = baseUrl + '/mobile/finished?check=true&finishid=' + d.id
            const pngBuffer: Buffer = qr.imageSync(url)
            v.qrCode = 'data:image/png;base64,' + pngBuffer.toString('base64')
            return v
        })
        const filePath = "report"+ uuid.v1()+".pdf"
        return ejs.renderFile(path.join(path.resolve(__dirname), '/../../htmlTemplate/template2.ejs'), {
            data:pdfData,
            items
        }).then((res) => {
            return new Promise((resolve, reject) => {
                pdf.create(res).toFile(filePath, (err, data) => {
                        if (!err) {
                            resolve(filePath)
                        } else
                            reject(err)
                    }
                )
            })
        })
    }
}
