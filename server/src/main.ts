import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { AutoPropertyValidationPipe } from './utils/auto-property-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const config = new DocumentBuilder()
    .setTitle('NestJS Swagger')
    .setDescription('API description')
    .setVersion('1.0')
    .build();

    
  app.enableCors();
  app.useGlobalPipes(
    new AutoPropertyValidationPipe(),
    new ValidationPipe()
    );
    
    
  app.use('/assets', express.static('src/assets'));
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(4000, '0.0.0.0', () => {
    console.log('Server is running on port 4000');
  });
}
bootstrap();
