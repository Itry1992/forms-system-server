import {ExceptionFilter, Catch, ArgumentsHost} from '@nestjs/common';

@Catch()
export class AnyExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        if (exception)
            console.log(exception)
        if (exception.message && exception.message.message && exception.message.message === 'jwt expired') {
            response.status('402').json({success: false})
        } else
            response
                .status('200')
                .json({
                    success: false,
                    timestamp: new Date().toISOString(),
                    path: request.url,
                    message: JSON.stringify(exception.message.message || exception.message || exception.error || exception)
                });
    }
}
