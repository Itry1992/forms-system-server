import {BadRequestException, Injectable} from "@nestjs/common";
import * as fs from "fs";
import path from "path";

// @Injectable()
export class ConfigService {
    static config: any = undefined
    static configFilePath = ''
    static getField =  (name: string) => {

        if (ConfigService.config !== undefined) {
            if (ConfigService.config[name] === undefined)
                throw {message: '配置文件中不存在的属性:' + name + ",当前读取文件路径:" + ConfigService.configFilePath}
            return ConfigService.config[name]
        }
        const evn = process.env.NODE_ENV
        let configFilePath = path.join(__dirname, '../../config-' + evn + '.js')
        if (!fs.existsSync(configFilePath)) {
            configFilePath = path.join(__dirname, '../../config.js')
            if (!fs.existsSync(configFilePath))
                throw new BadRequestException('no such file config.js or config-' + evn + '.js')
        }
        ConfigService.configFilePath = configFilePath
        const configFile: any =  require(configFilePath)
        ConfigService.config = configFile.config
        if (ConfigService.config[name] === undefined)
            throw {message: '配置文件中不存在的属性:' + name + ",当前读取文件路径:" + ConfigService.configFilePath}
        return ConfigService.config[name]
    }

}
