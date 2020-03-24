import {Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors} from "@nestjs/common";
import * as Fs from "fs";
import {Response} from 'express';
import {FileService} from "../service/file.service";
import {ApiConsumes, ApiTags} from "@nestjs/swagger";
import {FileInterceptor} from "@nestjs/platform-express";
import Attachment from "../../entity/attachment.entity";
import {ResponseUtil} from "../../common/response.util";

@Controller('/file')
@ApiTags('file')
export class FileController {
    constructor(private readonly fileService: FileService) {
    }

    @Post('/add')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    async addFile(@UploadedFile() file: any) {
        return this.fileService.addFile(file)
    }

    @Get('get/:id')
    async getFile(@Param('id')id: string, @Res() res: Response) {
        const entity = await Attachment.findByPk(id)
        // const  file = Fs.readFileSync(entity.localPath)
        // res.set('Content-Disposition',`attachment; filename=${entity.originalName}`)
        res.set('Content-Length', `${entity.size}`)


        const rs = Fs.createReadStream(entity.localPath)
        rs.on('data', chunk => {
            res.write(chunk, 'binary')
        })
        rs.on('end', () => {
            res.end()
        })
        rs.on('error', error => {
            // console.log(error)
            if (error.code === 'ENOENT') {
                res.status(200)
                    .json({
                        success: false,
                        message: '对应文件已被删除',
                    });
            } else
                res.status(200)
                    .json({
                        success: false,
                        message: error.message || '',
                        error
                    });
        })


        // res.
        // res.body.pipeTo(Fs.createReadStream(entity.localPath))
        // file.
    }
}
