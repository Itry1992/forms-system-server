import {Controller, Get} from '@nestjs/common';
import {AppService} from './app.service';
import {FileUploadConfig} from "./common/file.upload.config";


@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {
    }

    @Get()
    getHello(): string {
        return FileUploadConfig.getUrl()
    }
}
