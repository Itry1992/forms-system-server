import {Controller, Get, Param, Post, Query, Res, UploadedFile, UseInterceptors} from "@nestjs/common";
import * as Fs from "fs";
import {Response} from 'express';
import {FileService} from "../service/file.service";
import {ApiConsumes, ApiOperation, ApiTags} from "@nestjs/swagger";
import {FileInterceptor} from "@nestjs/platform-express";
import Attachment from "../../entity/attachment.entity";
import {ResponseUtil} from "../../common/response.util";
import {Op} from "sequelize";
import {FileUploadConfig} from "../../common/file.upload.config";


@Controller('/file')
@ApiTags('file')
export class FileController {
    constructor(private readonly fileService: FileService) {
    }

    @Post('/add')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    async addFile(@UploadedFile() file: any) {
        if (file)
            return this.fileService.addFile(file)
        else return ResponseUtil.error('no file')
    }

    @Get('get/:id')
    async getFile(@Param('id')id: string, @Res() res: Response) {
        const entity = await Attachment.findByPk(id)
        // const  file = Fs.readFileSync(entity.localPath)
        // res.set('Content-Disposition',`attachment; filename=${entity.originalName}`)
        res.set('Content-Length', `${entity.size}`)

        let path = entity.localPath
        if (!path.startsWith(FileUploadConfig.getUrl())) {
            path = FileUploadConfig.getUrl() + '/' + entity.localPath
        }
        const rs = Fs.createReadStream(path)
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
                        message: '未找到对应文件',
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

    @Get('/delete')
    @ApiOperation({
        description: 'ids 使用‘,’ 分割'
    })
    async delete(@Query('ids') ids: string) {
        return ResponseUtil.success(await Attachment.destroy({
            where: {
                id: {[Op.in]: ids.split(',')}
            }
        }))
    }
}
