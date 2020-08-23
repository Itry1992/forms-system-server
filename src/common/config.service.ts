import {BadRequestException, Injectable} from "@nestjs/common";
import * as fs from "fs";
import path from "path";

// @Injectable()
export class ConfigService {
    static configMap: Map<string, string>

    static getField = (name: string) => {

        if (ConfigService.configMap == null) {
            ConfigService.configMap = new Map<string, string>()
        }
        const keyValue = ConfigService.configMap
        if (ConfigService.configMap.get(name))
            return ConfigService.configMap.get(name)
        const evn = process.env.NODE_ENV
        console.log("config-evn", evn,name,keyValue)
        let configFilePath = path.join(__dirname, '../../config-' + evn + '.properties')
        if (!fs.existsSync(configFilePath)) {
            configFilePath = path.join(__dirname, '../../config.properties')
            if (!fs.existsSync(configFilePath))
                throw new BadRequestException('no such file config.properties and config-' + evn + '.properties')
        }
        try {
            const content = fs.readFileSync(configFilePath);
            const regexjing = /\s*(#+)/;  //去除注释行的正则
            const regexkong = /\s*=\s*/;  //去除=号前后的空格的正则

            let arrCase = null;
            const regexLine = /.+/g;  //匹配换行符以外的所有字符的正则
            while (arrCase = regexLine.exec(content.toString())) {  //过滤掉空行
                if (!regexjing.test(arrCase)) {  //去除注释行
                    keyValue.set(arrCase.toString().split(regexkong)[0], arrCase.toString().split(regexkong)[1])
                    console.log(arrCase.toString());
                }
            }
            const value = keyValue.get(name);
            if (!value )
                throw new BadRequestException('need set ' + name + ' at ' +configFilePath)
            return  value
        } catch (e) {
            //e.message  //这里根据自己的需求返回
            throw e
            // return null;
        }

    }
}
