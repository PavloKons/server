import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Answer } from './entities/answer.entity';
import { Model } from 'mongoose';
import { QuestionsService } from '../questions/questions.service';
import { MediaService } from 'media/services/media.service';
import * as mongoose from 'mongoose';
import axios from 'axios';


//imagekit service
// import { ImageKitService } from '../utils/imagekit.service';
@Injectable()
export class AnswersService {
  constructor(
    @InjectModel('Answer') private AnswerModel: Model<Answer>,
    private questionsService: QuestionsService,
    // private readonly imageKitService: ImageKitService,
    private readonly mediaService: MediaService,
  ) {}

  async create(
    createAnswerDto: CreateAnswerDto,
    video?: Express.Multer.File,
  ) {
    // Check if the question exists

    const question = await this.questionsService.findOne(
      createAnswerDto.question_id,
    );
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Check if the answer exists
    const answer = await this.findQuestionAndJob(
      createAnswerDto.interviewee,
      question?.job_id?._id,
    );
    // Check if the question is already submitted for this answer
    if (
      answer?.questions?.some(
        (q) => q.question_id._id == createAnswerDto.question_id,
      )
    ) {
      throw new ConflictException(
        'You have already submitted a video for this question.',
      );
    }
console.log("11111111111")
    if (video) {

      const {duration,url,twatched,svid,fid} = await this.mediaService.saveVideo(video);
      const videoUrl = url.replace('/data','/videos/video.mp4');
      const thumbnail = url.replace('/data','/thumbnails/video.jpg')
      const time = duration/2

      await axios.post(
        `https://muse.ai/api/files/set/${fid}/cover`,
        '',
        {
            params: {
                't': time
            },
            headers: {
                'Key': 'mjGkOzoWFcEjHUYl0nlnGZBF65c06a2e'
            }
        }
      );
      createAnswerDto.video_url = videoUrl,
      createAnswerDto.duration = duration,
      createAnswerDto.isWatched = twatched,
      createAnswerDto.SVid = svid,
      createAnswerDto.thumbnail = thumbnail
    }
    console.log("1111111wewew1111")
    if (answer) {
      console.log("2222222222222222")
      console.log(answer);
      const videoUrl = answer.questions[0].video_url
      const videoID = videoUrl.replace('https://cdn.muse.ai/w/','').replace('/videos/video.mp4','')
      //delete the existing video & replace with new video 
      await axios.delete(`https://muse.ai/api/files/delete/${videoID}`, {
      headers: {
          'Key': 'mjGkOzoWFcEjHUYl0nlnGZBF65c06a2e'
      }});

      console.log("1111111111111111111111111")
      // Update the existing answer with the new question and video URL
      return await this.AnswerModel.findByIdAndUpdate(
        answer._id,
        {
          $push: {
            questions: {
              question_id: createAnswerDto.question_id,
              video_url: createAnswerDto.video_url,
              duration: createAnswerDto.duration,
              isWatched: createAnswerDto.isWatched,
              svid: createAnswerDto.SVid,
              thumbnail: createAnswerDto.thumbnail,
            },
          },
        },
        {
          new: true,
        },
      );
    }
    console.log("23333333333333333333")
    return await this.AnswerModel.create({
      interviewee: createAnswerDto.interviewee,
      interviewer: createAnswerDto.interviewer,
      job_id: createAnswerDto.job_id,
      
      questions: [
        {
          question_id: createAnswerDto.question_id,
          video_url: createAnswerDto.video_url,
          duration: createAnswerDto.duration,
          isWatched: createAnswerDto.isWatched,
          thumbnail: createAnswerDto.thumbnail,
        },
      ],
    });
  }



  

  async createMany(body, recordings) {
    const _body = Object.keys(body).map((b) => JSON.parse(body[b]));

    if (_body?.length) {
      return await _body.map(
        async (createAnswerDto: CreateAnswerDto, index: any) => {
          console.log(createAnswerDto);
          // Check if the question exists
          const question = await this.questionsService.findOne(
            createAnswerDto.question_id,
          );
          if (!question) {
            // throw new NotFoundException('Question not found');
            return null;
          }

          // Check if the answer exists
          const answer = await this.findQuestionAndJob(
            createAnswerDto.interviewee,
            question?.job_id?._id,
          );
          // Check if the question is already submitted for this answer
          if (
            answer?.questions?.some(
              (q) => q.question_id._id == createAnswerDto.question_id,
            )
          ) {
            // throw new ConflictException(
            //   'You have already submitted a video for this question.',
            // );
            return null;
          }

          //uploading video to muse ai
          createAnswerDto.video_url = await this.mediaService.saveVideo(
            recordings[index],
          );
          if (answer) {
            // Update the existing answer with the new question and video URL
            return await this.AnswerModel.findByIdAndUpdate(
              answer._id,
              {
                $push: {
                  questions: {
                    question_id: createAnswerDto.question_id,
                    video_url: createAnswerDto.video_url,
                  },
                },
              },
              {
                new: true,
              },
            );
          }

          return await this.AnswerModel.create({
            interviewee: createAnswerDto.interviewee,
            interviewer: createAnswerDto.interviewer,
            job_id: createAnswerDto.job_id,
            questions: [
              {
                question_id: createAnswerDto.question_id,
                video_url: createAnswerDto.video_url,
              },
            ],
          });
        },
      );
    }
  }

  async findAll() {
    let answers = await this.AnswerModel.find()
      .populate({
        path: 'interviewee',
        select: '-password',
      })
      .populate({
        path: 'job_id',
      })
      .populate({
        path: 'interview',
        select: '-password',
      })

      .populate('questions.question_id');

    if (answers.length == 0) {
      throw new NotFoundException('answers not found');
    }
    return answers;
  }

  async findQuestionAndJob(interviewee: string, job_id: string) {
    let answer = await this.AnswerModel.findOne({
      job_id,
      interviewee,
    })
      .populate({
        path: 'interviewee',
        select: '-password',
      })
      .populate({
        path: 'job_id',
      })
      .populate('questions.question_id');
    return answer;
  }

  async findOne(id: string) {
    let answer = await this.AnswerModel.findById(id)
      .populate({
        path: 'interviewee',
        select: '-password',
      })
      .populate({
        path: 'job_id',
      })

      .populate({
        path: 'interviewer',
        select: '-password',
      })

      .populate('questions.question_id');
    if (!answer) {
      throw new NotFoundException('answer not found');
    }
    return answer;
  }

  async update(id: string, updateAnswerDto: UpdateAnswerDto) {
    let answer = await this.AnswerModel.findById(id);
    if (!answer) {
      throw new NotFoundException('answer not found');
    }
    // const videoURL = interview.questions[0].video_url
    // const videoID = videoURL.replace('https://cdn.muse.ai/w/','').replace('/videos/video.mp4','')
    await this.AnswerModel.findByIdAndUpdate(id, updateAnswerDto, {
      new: true,
    })
      .populate({
        path: 'interviewee',
        select: '-password',
      })
      .populate({
        path: 'job_id',
      })

      .populate({
        path: 'interviewer',
        select: '-password',
      })

      .populate('questions.question_id');
    return await this.AnswerModel.find()
      .populate({
        path: 'interviewee',
        select: '-password',
      })
      .populate({
        path: 'job_id',
      })
      .populate({
        path: 'interviewer',
        select: '-password',
      })

      .populate('questions.question_id');
  }

  async remove(id: string) {
    let answer = await this.AnswerModel.findById(id);
    if (!answer) {
      throw new NotFoundException('answer not found');
    }
    const videoUrl = answer.questions[0].video_url
    // 'https://cdn.muse.ai/w/ab10d8e20ef0fd65245c43daf39b9c5d08c5833ebc9b545186f4a3f4d735c22a/videos/video.mp4'
    const videoID = videoUrl.replace('https://cdn.muse.ai/w/','').replace('/videos/video.mp4','')
   
    console.log(videoID)
    console.log(videoUrl,"this is video url")

    await axios.delete(`https://muse.ai/api/files/delete/${videoID}`, {
    headers: {
        'Key': 'mjGkOzoWFcEjHUYl0nlnGZBF65c06a2e'
    }});

    return await this.AnswerModel.findByIdAndRemove(id)
      .populate({
        path: 'interviewee',
        select: '-password',
      })
      .populate({
        path: 'job_id',
      })
      .populate({
        path: 'interviewer',
        select: '-password',
      })

      .populate('questions.question_id');
  }

  // async remove(id: string, userId: string) {
  //   let interview = await this.InterviewModel.findById(id);

  //   if (!interview) {
  //     throw new NotFoundException('Interview not found');
  //   }

  //   if (interview.interviewee.toString() !== userId) {
  //     throw new UnauthorizedException('You do not have permission to delete this interview');
  //   }
  //   return await this.InterviewModel.findByIdAndRemove(id)
  //     .populate({
  //       path: 'interviewee',
  //       select: '-password',
  //     })
  //     .populate({
  //       path: 'job_id',
  //     })
  //     .populate({
  //       path: 'interviewer',
  //       select: '-password',
  //     })
  //     .populate('questions.question_id');
  // }

  async interviwee(id: string) {
    let answers = await this.AnswerModel.find({
      job_id: id,
    })
      .populate({
        path: 'interviewee',
        select: '-password',
      })
      .populate({
        path: 'job_id',
      })
      .populate({
        path: 'interviewer',
        select: '-password',
      })
      .populate('questions.question_id');
    if (answers.length == 0) {
      throw new NotFoundException('answers not found');
    }
    return answers;
  }

  async findAnswersByTimeRange(timeRange: string): Promise<Answer[]> {
    const currentDate = new Date();

    switch (timeRange) {
      case 'lastHour':
        currentDate.setHours(currentDate.getHours() - 1);
        break;
      case 'today':
        currentDate.setHours(0, 0, 0, 0);
        break;
      case 'thisWeek':
        currentDate.setDate(currentDate.getDate() - currentDate.getDay());
        currentDate.setHours(0, 0, 0, 0);
        break;
      case 'thisMonth':
        currentDate.setDate(1);
        currentDate.setHours(0, 0, 0, 0);
        break;
      case 'thisYear':
        currentDate.setMonth(0, 1);
        currentDate.setHours(0, 0, 0, 0);
        break;
      case 'recent':
        return await this.AnswerModel.find({})
          .sort({ createdAt: -1 })
          .populate({
            path: 'interviewee',
            select: '-password',
          })
          .populate({
            path: 'job_id',
          })
          .populate({
            path: 'interviewer',
            select: '-password',
          })
          .populate('questions.question_id');

      case 'byIntervieweeName':
        return await this.AnswerModel.find({})
          .sort({ 'interviewee.name': 1 })
          .populate({
            path: 'interviewee',
            select: '-password',
          })
          .populate({
            path: 'job_id',
          })
          .populate({
            path: 'interviewer',
            select: '-password',
          })
          .populate('questions.question_id');

      default:
        throw new NotFoundException('Invalid filter');
    }

    const answers = await this.AnswerModel.find({
      createdAt: { $gte: currentDate },
    })
      .populate({
        path: 'interviewee',
        select: '-password',
      })
      .populate({
        path: 'job_id',
      })
      .populate({
        path: 'interviewer',
        select: '-password',
      })
      .populate('questions.question_id');

    if (answers.length === 0) {
      throw new NotFoundException('Answers not found');
    }

    return answers;
  }

  async allInterviwee(id: string) {
    let answers = await this.AnswerModel.find({
      interviewer: new mongoose.Types.ObjectId(id),
    })
      .populate({
        path: 'interviewee',
        select: '-password',
      })
      .populate({
        path: 'job_id',
      })
      .populate({
        path: 'interviewer',
        select: '-password',
      })
      .populate('questions.question_id');
    if (answers.length == 0) {
      throw new NotFoundException('answers not found');
    }
    return answers;
  }

  async getRandomAnswers() {
    const formattedAnswers = await this.AnswerModel.find()
      .populate({
        path: 'questions.question_id',
      })
      .populate({
        path: 'interviewee',
      });

    const randomAnswers = this.shuffleArray(formattedAnswers).slice( 0, 10, );

    const result = randomAnswers.map((answer) => ({
      _id: answer._id,
      questions: answer.questions.map((question) => ({
        question_id: {
          _id: question._id,
          question: question.question,
          time_duration: question.time_duration,
        },
        video_url: question.video_url,
        _id: question._id,
      })),
      interviewee: answer.interviewee
        ? {
            name: answer.interviewee.name,
            location: answer.interviewee.location,
          }
        : null,
    }));

    return result;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}