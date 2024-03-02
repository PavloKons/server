// otp.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Otp,OtpSchema } from './otp.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Otp', schema: OtpSchema }])],
  exports: [MongooseModule],
})
export class OtpModule {}
