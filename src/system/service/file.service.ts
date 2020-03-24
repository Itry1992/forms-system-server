import {Injectable} from "@nestjs/common";
import * as Fs from "fs";
import {FileUpLoadUrl} from "../../common/file.upload.url";
import moment from "moment";
import * as uuid from 'node-uuid';
import {ResponseUtil} from "../../common/response.util";
import Attachment from "../../entity/attachment.entity";

@Injectable()
export class FileService {

    async addFile(file: any) {
        const uploadFile: string = FileUpLoadUrl.url
        const parentFile = `${uploadFile}/${moment().format('YYMMDD')}`;
        // Fs.
        if (!Fs.existsSync(parentFile)) {
            Fs.mkdirSync(parentFile);
        }
        // console.log(file);
        const localPath = parentFile + '/' + uuid.v4() + this.getFileprx(file.originalname);
        try {
            Fs.writeFileSync(localPath, file.buffer);
        } catch (e) {
            return ResponseUtil.error('创建文件失败')
        }
        return Attachment.create({
            localPath,
            size: file.size,
            fileType: file.mimetype,
            originalName: file.originalname,
        }).then(res => {
            res.localPath = ''
            return ResponseUtil.success('创建成功', res)
        });
    }

    private getFileprx(on: string) {
        // console.log(on)
        const last = on.lastIndexOf('\.')
        return on.substring(last)
    }
}
