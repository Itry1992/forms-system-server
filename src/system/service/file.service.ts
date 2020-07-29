import {Injectable} from "@nestjs/common";
import * as Fs from "fs";
import {FileUploadConfig} from "../../common/file.upload.config";
import moment from "moment";
import * as uuid from 'node-uuid';
import {ResponseUtil} from "../../common/response.util";
import Attachment from "../../entity/attachment.entity";
import images from "images";

@Injectable()
export class FileService {

    async addFile(file: any) {
        const uploadFile: string = FileUploadConfig.getUrl()
        const parentFile = `${uploadFile}/${moment().format('YYMMDD')}`;
        // Fs.
        if (!Fs.existsSync(parentFile)) {
            Fs.mkdirSync(parentFile,{recursive:true});
        }
        const rParentPath = `${moment().format('YYMMDD')}`
        // console.log(file);
        const rPath = rParentPath + '/' + uuid.v4() + this.getFileprx(file.originalname)
        try {
            Fs.writeFileSync(uploadFile + '/' + rPath, file.buffer);
        } catch (e) {
            return ResponseUtil.error('创建文件失败')
        }
        let rThumbPath = ''
        if (file.mimetype.includes('image/')) {
            if (!Fs.existsSync(parentFile+'/thumb')) {
                Fs.mkdirSync(parentFile+'/thumb',{recursive:true});
            }
            rThumbPath = rParentPath + '/thumb/' + uuid.v1() + this.getFileprx(file.originalname)
            images(file.buffer).resize(600).save(uploadFile + '/' + rThumbPath, {               //Save the image to a file, with the quality of 50
                quality: 80                    //保存图片到文件,图片质量为50
            })
        }


        return Attachment.create({
            localPath: rPath,
            thumbPath: rThumbPath,
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
