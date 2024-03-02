import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseInterceptors,
  UploadedFile,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseFilePipeBuilder,
  Query,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnswersService } from './answers.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';

import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
// JWT auth guard
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
//Role Guard
import { RolesGuard } from '../auth/role-base-auth/role.guard';
import { Roles } from '../auth/role-base-auth/roles.decorator';
import { ROLE } from '../users/enums/users.enums';
import { filter } from 'rxjs';

@Controller('answers')
@ApiTags('answers')
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(ROLE.INTERVIEWEE)
  @UseInterceptors(FileInterceptor('video'))
  async create(
    @Body() createAnswerDto: CreateAnswerDto,
    @UploadedFile() video?: Express.Multer.File,
  ) {
    // createInterviewDto.interviewee = req.user.id
    return this.answersService.create(createAnswerDto, video);
  }

  @Get('random')
  async getRandomAnswers() {
    const randomAnswers = await this.answersService.getRandomAnswers();
    return randomAnswers;
  }


  @Post('/submit-questions')
  @UseInterceptors(AnyFilesInterceptor())
  async createMany(
    @UploadedFiles() recordings: Array<Express.Multer.File>,
    @Body() body,
  ) {
    return this.answersService.createMany(body, recordings);
  }

  @Get()
  async findAll(
    @Query('filter') filters?: string | string[],
    @Query('intervieweeName') intervieweeName?: string,
  ) {
    let answers;

    console.log(filters)
    if (filters) {
      const filterArray = Array.isArray(filters) ? filters : [filters];

      if (filterArray.length > 0) {
        answers = await Promise.all(
          filterArray.map((filter) =>
            this.answersService.findAnswersByTimeRange(filter),
          ),
        );
        answers = answers.flat();
      }
    } else {
      answers = await this.answersService.findAll();
    }
    console.log(answers);
    return answers;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.answersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAnswerDto: UpdateAnswerDto,
  ) {
    return this.answersService.update(id, updateAnswerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.answersService.remove(id);
  }

  // @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // remove(@Param('id') id: string, @Request() req) {
  //   const userId = req.user.id;
  //   return this.interviewsService.remove(id, userId);
  // }

  @Get('user/all-answers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.INTERVIEWER)
  allAnswersfor(@Request() req, @Param('id') id: string) {
    return this.answersService.interviwee(id);
  }

  @Get('all-answers-by-interviewer/:id')
  allAnswersByInterviewer(@Request() req, @Param('id') id: string) {
    return this.answersService.allInterviwee(id);
  }


}


