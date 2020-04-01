import {NestFactory} from '@nestjs/core';
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import {AppModule} from './app.module';
import * as express from "express";
import {logger} from "./common/logger";
import {AnyExceptionFilter} from "./common/AnyExceptionFilter";


async function bootstrap() {
    const app = await NestFactory.create(AppModule);


    app.use(logger)
    app.useGlobalFilters(new AnyExceptionFilter())


    app.use(express.json({limit: '50mb'}));
    const options = new DocumentBuilder()
        .addBearerAuth()
        .setTitle(' API')
        .setDescription('The  API description')
        .setVersion('1.0')
        // .addTag('cats')
        .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api', app, document);
    const isProduction = process.env.NODE_ENV === 'pro';
    if (isProduction)
        await app.listen(3003)
    else
        await app.listen(3001);
}

bootstrap();
