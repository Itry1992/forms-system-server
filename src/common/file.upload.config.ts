export const FileUploadUrl = {
    devUrl:'C:/Users/wz_pc\\Desktop\\jtupload\\formdata',
    proUrl:'E:/upload/formdata'
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
}


