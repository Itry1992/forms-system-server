import {Request} from "express";
import LogRequest from "../entity/log.request.entity";

export function logger(request: Request, res, next) {
    next()
    if (!request.originalUrl.startsWith('/api'))
        LogRequest.create({ip: request.ip, baseUrl: request.originalUrl, data: JSON.stringify(request.body)})
}
