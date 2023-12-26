import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './redis/redis.adapter';
import { BadRequestException, Logger, ValidationError, ValidationPipe } from '@nestjs/common';

import * as dotenv from 'dotenv';
dotenv.config();
const logger = new Logger('Crew Chat');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);
  logger.log(`Crew chat is listening on Port ${process.env.PORT}`);
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        if (validationErrors[0]?.children.length) {
          return new BadRequestException(
            Object.values(validationErrors[0].children[0].constraints)[0],
          );
        } else {
          return new BadRequestException(
            Object.values(validationErrors[0].constraints)[0],
          );
        }
      },
    }),
  );

  await app.listen(`${process.env.PORT}`);
}
bootstrap();
