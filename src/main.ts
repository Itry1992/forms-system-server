import { NestFactory } from '@nestjs/core';
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import { AppModule } from './app.module';

import {logger} from "./common/logger";
import {AnyExceptionFilter} from "./common/AnyExceptionFilter";


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const options = new DocumentBuilder()
      .addBearerAuth()
      .setTitle(' API')
      .setDescription('The  API description')
      .setVersion('1.0')
      // .addTag('cats')
      .build();

  app.use(logger)
  app.useGlobalFilters(new AnyExceptionFilter())

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);
  await app.listen(3001);
}
bootstrap();
