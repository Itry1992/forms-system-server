export const FileUploadUrl = {
    devUrl:'F:\\jtupload\\formdata',
    proUrl:'E:/upload/formdata',
    devDownUrl:'http://192.168.0.104:3001/file/get',
    proDownUrl:'http://forms.jtinfo.top/api/file/get'
}

export class FileUploadConfig {
    static getUrl() {
        // console.log('evn:::',process.env.NODE_ENV)
        const isProduction = process.env.NODE_ENV === 'pro';
        if (isProduction) {
            return FileUploadUrl.proUrl
        }
        return FileUploadUrl.devUrl
    }

    static getDownUrl() {
        const isProduction = process.env.NODE_ENV === 'pro';
        if (isProduction) {
            return FileUploadUrl.proDownUrl
        }
        return FileUploadUrl.devDownUrl
    }
}


