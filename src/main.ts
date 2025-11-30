import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
    dotenv.config();
    const app = await NestFactory.create(AppModule);
    const port = process.env.PORT || 3300;
    app.enableCors();
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();