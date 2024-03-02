import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInterviewDto } from '../dtos/create-interview.dto';
import { UpdateInterviewDto } from '../dtos/update-interview.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Interview } from '../entities/interview.entity';
import { Model } from 'mongoose';
import { QuestionsService } from '../../questions/questions.service';
import { NotificationGateway } from 'src/notifications/gateways/notification.gateway';
import { UsersService } from 'src/users/users.service';
import * as crypto from 'crypto';


@Injectable()
export class InterviewService {
  constructor(
    @InjectModel('Interview') private interviewModel: Model<Interview>,
    private questionsService: QuestionsService,
    private notificationGateway: NotificationGateway,
    private userService: UsersService,
  ) {}

  // async create(createInterviewerDto: CreateInterviewerDto) {
  //   // Check if the question exists
  //   const question = await this.questionsService.findOne(
  //     createInterviewerDto.question_id,
  //   );
  //   if (!question) {
  //     throw new NotFoundException('Question not found');
  //   }

  //   // Check if the interview exists
  //   const interview = await this.findQuestionAndJob(
  //     createInterviewerDto.interviewee,
  //     question?.job_id?._id,
  //   );

  //   let createdInterviewer;

  //   if (interview) {
  //     // Update the existing interviewer with the new question
  //     createdInterviewer = await this.interviewerModel.findByIdAndUpdate(
  //       interview._id,
  //       {
  //         $push: {
  //           questions: {
  //             question_id: createInterviewerDto.question_id,
  //           },
  //         },
  //       },
  //       {
  //         new: true,
  //       },
  //     );
  //   } else {
  //     createdInterviewer = await this.interviewerModel.create({
  //       // interviewee: createInterviewerDto.interviewee,
  //       interviewer: createInterviewerDto.interviewer,
  //       job_title: createInterviewerDto.job_title,
  //       questions: [
  //         {
  //           question_id: createInterviewerDto.question_id,
  //         },
  //       ],
  //     });
  //   }

  //   // Notify the interviewee
  //   const intervieweeId = createdInterviewer.interviewee;
  //   const notificationMessage =
  //     'You have been invited for an interview for job';

  //   this.notificationGateway.handleNotification(
  //     `${intervieweeId}: ${notificationMessage}`,
  //   );

  //   return createdInterviewer;
  // }


  async create(createInterviewDto: CreateInterviewDto) {
    try {
      const interview = await this.userService.findById(
        createInterviewDto.interviewer,
      );

      if (!interview) {
        throw new NotFoundException('Interview not found');
      }

      function generateUniqueLink(): string {
        const uniqueId = crypto.randomBytes(8).toString('hex');
        return `https://staging.videointerviews.io/${uniqueId}`;
        // return `http://localhost:3000/video-interviews/${uniqueId}`;

      }
    
        console.log("sdfsdf")
      const uniqueLink = generateUniqueLink();
      
      const interviewWithLink = {
        ...createInterviewDto,
        share_link: uniqueLink,
      };
  

      const createdInterview = await this.interviewModel.create(
        interviewWithLink,
      );
      return createdInterview;
    } catch (error) {
      console.error(error);
      throw new NotFoundException('Error creating interview');
    }
  }

  async findAll() {
    let interviews = await this.interviewModel
      .find()
      // .populate({
      //   path: 'interviewee',
      //   select: '-password',
      // })
      .populate({
        path: 'job_title',
      })
      .populate({
        path: 'job_recruiter'
      })
      .populate('questions')
      .populate('interview', '-password');

    if (interviews.length == 0) {
      throw new NotFoundException('interview not found');
    }
    return interviews;
  }

  async findQuestionAndJob(interviewee: string, job_title: string) {
    let interview = await this.interviewModel
      .findOne({
        job_title,
      })
      .populate({
        path: 'interviewee',
        select: '-password',
      })
      .populate({
        path: 'job_id',
      })
      .populate({
        path: 'job_recruiter'
      })
      .populate('questions');

    return interview;
  }

  async findOne(id: string) {
    let interview = await this.interviewModel
      .findById(id)
      // .populate({
      //   path: 'interviewee',
      //   select: '-password',
      // })
      .populate({
        path: 'job_title',
      })
      .populate({
        path: 'job_recruiter'
      })
      .populate('questions')
      .populate('interview', '-password');

    if (!interview) {
      throw new NotFoundException('interview not found');
    }
    return interview;
  }

  async update(id: string, updateInterviewDto: UpdateInterviewDto) {
    let interview = await this.interviewModel.findById(id);
    if (!interview) {
      throw new NotFoundException('interview not found');
    }
    return await this.interviewModel
      .findByIdAndUpdate(id, updateInterviewDto, { new: true })
      // .populate({
      //   path: 'interviewer',
      //   select: '-password',
      // })
      .populate({
        path: 'job_title',
      })
      .populate({
        path: 'job_recruiter'
      })
      .populate('questions')
      .populate('interview', '-password');
  }

  async remove(id: string) {
    let interview = await this.interviewModel.findById(id);
    if (!interview) {
      throw new NotFoundException('interview not found');
    }
    return await this.interviewModel
      .findByIdAndRemove(id)
      // .populate({
      //   path: 'interviewer',
      //   select: '-password',
      // })
      .populate({
        path: 'job_title',
      })
      .populate({
        path: 'job_recruiter'
      })
      .populate('questions');
  }

  //   async interviwee(id: string) {
  //     let interviews = await this.InterviewModel.find({
  //       job_id: id
  //     })
  //       .populate({
  //         path: 'interviewee',
  //         select: '-password',
  //       })
  //       .populate({
  //         path: 'job_id',
  //       })
  //       .populate('questions.question_id');
  //     if (interviews.length == 0) {
  //       throw new NotFoundException('interviews not found');
  //     }
  //     return interviews
  //   }
}
