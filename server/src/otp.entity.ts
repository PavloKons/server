import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Otp extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ default: Date.now, expires: 600 }) // 10 minutes expiration
  createdAt: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
