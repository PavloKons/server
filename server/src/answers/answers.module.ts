import { Module } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { AnswersController } from './answers.controller';

import { MongooseModule } from '@nestjs/mongoose';
import { AnswerSchema } from './entities/answer.entity'
import { QuestionsModule } from '../questions/questions.module'
//configuring imagekit service
import { ImageKitService } from '../utils/imagekit.service'


//configuration of config
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service'
import { JwtStrategy } from '../auth/strategies/jwt.strategy'
import { MediaService } from 'media/services/media.service';


@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Replace with your actual JWT secret key
      signOptions: { expiresIn: '1d' }, // Replace with your desired token expiration time
    }),
    MongooseModule.forFeature([{ name: 'Answer', schema: AnswerSchema }]),
    QuestionsModule
  ],
  controllers: [AnswersController],
  providers: [AnswersService, ImageKitService, AuthService, JwtStrategy,MediaService],
  exports: [AnswersService]
})
export class AnswersModule { }
