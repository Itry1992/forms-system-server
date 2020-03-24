export class ResponseUtil {
    static success(data?: any, message?: string) {
        return {success: true, data, message}
    }

    static page(data: { rows: any[]; count: number }, message?: string) {
        return {success: true, data: data.rows, count: data.count, message}
    }

    static error(message?, error?) {
        return {success: false, message, error}
    }

    static unAuth() {
        return {success: false, message: ' no auth'};
    }

    static noId(name?: string) {
        return {success: false, message: ` no ${name} id`};
    }
}
