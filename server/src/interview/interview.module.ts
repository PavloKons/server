import { Module } from '@nestjs/common';
import { InterviewController } from './controllers/interview.controller';
import { InterviewService } from './services/interview.service';
import { QuestionsService } from '../questions/questions.service';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewSchema  } from './entities/interview.entity';
// import { InterviewsModule } from 'src/interviews/interviews.module';
import { QuestionSchema } from 'src/questions/entities/question.entity';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UsersModule } from 'src/users/users.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Interview', schema: InterviewSchema }]),
    MongooseModule.forFeature([{ name: 'Question', schema: QuestionSchema }]),
    JwtModule,NotificationsModule,UsersModule
  ],
  controllers: [InterviewController],
  providers: [InterviewService, QuestionsService,],
})
export class InterviewModule {}
