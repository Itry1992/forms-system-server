import {Request} from "express";


export function logger(request: Request, res, next) {
    next()
    if (!request.originalUrl.startsWith('/api')) {
        console.log(request.originalUrl, request.body)
        // LogRequest.create({ip: request.ip, baseUrl: request.originalUrl, data: JSON.stringify(request.body)})
    }
}
