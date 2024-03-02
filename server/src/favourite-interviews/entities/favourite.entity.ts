// favorite-interview.entity.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Answer } from 'src/answers/entities/answer.entity';
import { User } from '../../users/entities/user.entity';
import * as mongoose from 'mongoose';


@Schema({ timestamps: true })
export class FavouriteInterview extends Document {

  @Prop({ type: [{ type: 'ObjectId', ref: 'Interview' }] })
  favoriteInterview: Answer; 

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  interviewer: User;


}
export const FavouriteInterviewSchema = SchemaFactory.createForClass(FavouriteInterview);
