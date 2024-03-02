import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InterviewService } from '../services/interview.service';
import { CreateInterviewDto } from '../dtos/create-interview.dto';
import { UpdateInterviewDto } from '../dtos/update-interview.dto';
 // JWT auth guard
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

//Role Guard
import { RolesGuard } from 'src/auth/role-base-auth/role.guard';
import { Roles } from 'src/auth/role-base-auth/roles.decorator';
import { ROLE } from '../../users/enums/users.enums'

@Controller('interview')
@ApiTags('interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService,
  ) { }

  @Post("create")
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(ROLE.INTERVIEWER)
  async create(
  @Body() createInterviewDto: CreateInterviewDto, @Request() req) {
        createInterviewDto.interviewer = createInterviewDto.interviewer
        console.log("test")
    return this.interviewService.create(createInterviewDto);
  }

  @Get()
  findAll() {
    return this.interviewService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.interviewService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInterviewDto: UpdateInterviewDto) {
    return this.interviewService.update(id, updateInterviewDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.interviewService.remove(id);
  }

}
