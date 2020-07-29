import {ConfigService} from "./config.service";


export class FileUploadConfig {
    static getUrl() {
        // console.log('evn:::',process.env.NODE_ENV)
        return ConfigService.getField('upload')
    }

    static getDownUrl() {
        return ConfigService.getField('downBaseUrl')
    }
}


