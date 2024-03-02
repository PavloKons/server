import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// user module
import { UsersModule } from './users/users.module';
import { UserSchema } from './users/entities/user.entity'
//configuration of config
import { ConfigModule } from '@nestjs/config';
// mongoose configuration
import { MongooseModule } from '@nestjs/mongoose';
//JWT module configuration
import { JwtModule } from '@nestjs/jwt';
import { VideoUploadingModule } from './video-uploading/video-uploading.module';
import { QuestionsModule } from './questions/questions.module';
import { JobsModule } from './jobs/jobs.module';
import { AnswersModule } from './answers/answers.module';
//roles configuration
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/role-base-auth/role.guard';
//social signin module
import { SocialAuthModule } from './social-auth/social-auth.module';
//messaging module
import { MessagingModule } from './messaging/messaging.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InterviewModule } from './interview/interview.module';
import { FavouriteInterviewsModule } from './favourite-interviews/favourite-interviews.module';
import { MediaModule } from 'media/media.module';
import { PaymentsModule } from './payments/payments.module';
import { Otp, OtpSchema } from './otp.entity';


@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_DB_URL,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }, { name: 'Otp', schema: OtpSchema }]),
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Replace with your actual JWT secret key
      signOptions: { expiresIn: '1d' }, // Replace with your desired token expiration time

    }),
    VideoUploadingModule,
    QuestionsModule,
    JobsModule,
    AnswersModule,
    SocialAuthModule,
    MessagingModule,
    NotificationsModule,
    InterviewModule,
    AuthModule,
    FavouriteInterviewsModule,
    MediaModule,
    PaymentsModule
    
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AppService],
})
export class AppModule { }
