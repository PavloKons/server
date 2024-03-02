import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Job } from '../../jobs/entities/job.entity';
import { User } from '../../users/entities/user.entity';
import { Question } from '../../questions/entities/question.entity';
import { Interview } from '../../interview/entities/interview.entity';
import * as mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Answer extends Document {
  @Prop([
    {
      question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      video_url: { type: String },
      duration: { type: String },
      isWatched: { type: String },
      thumbnail: { type: String },
    },
  ])
  questions: [
    {
      question_id: Question;
      video_url: string;
      duration:string;
      isWatched:string;
      thumbnail:string;
    },
  ];

  //making link with job
  @Prop({ type: String })
  job_id: string;

  //who is interviewee
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  interviewee: User;

  // Link to Interviewer
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  interview: Interview;
  
  @Prop({ type: Boolean, default: false })
  favourite: boolean;

}

export const AnswerSchema = SchemaFactory.createForClass(Answer);
