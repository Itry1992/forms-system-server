import {Controller, Get} from "@nestjs/common";
import path from "path";
import * as ejs from "ejs";
import * as qr from "qr-image";
import * as pdf from "html-pdf";

@Controller('test')
export class TestController {
    @Get('pdf')
    async pdfMaker() {
        const pngBuffer: Buffer = qr.imageSync('i love you ~3')
        const ss = pngBuffer.toString('base64')
        const data = [{title: '111', qrCode: 'data:image/png;base64,' + ss},
            {title: '333', qrCode: 'data:image/png;base64,' + ss}, {
                title: '234',
                qrCode: 'data:image/png;base64,' + ss
            }, {title: 'qdf', qrCode: 'data:image/png;base64,' + ss}]
        console.log(path.join(path.resolve(__dirname), '/../../htmlTemplate/template1.ejs'))
        return ejs.renderFile(path.join(path.resolve(__dirname), '/../../htmlTemplate/template1.ejs'), {data}).then(res => {
            return new Promise((resolve, reject) => {
                pdf.create(res).toFile("report.pdf", (err, data) => {
                        if (!err) {
                            resolve(data)
                        } else
                            reject(err)
                    }
                )
            })
        })

    }
}
