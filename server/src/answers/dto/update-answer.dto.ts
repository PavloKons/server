// import { PartialType } from '@nestjs/mapped-types';
// import { CreateInterviewDto } from './create-interview.dto';

import { IsBoolean, IsDefined, IsMongoId, IsOptional, IsString } from 'class-validator';


export class UpdateAnswerDto {

    @IsMongoId()
    question_id: string;

    @IsOptional()
    video_url: string;

    @IsOptional()
    @IsString()
    duration: string;

    @IsOptional()
    @IsString()
    isWatched: string;

    @IsOptional()
    @IsString()
    SVid: string;


    @IsOptional()
    @IsMongoId()
    interviewee: string;

    @IsOptional()
    @IsMongoId()
    job_id: string

    @IsOptional()
    @IsMongoId()
    interviewer: string;

    @IsOptional()
    @IsBoolean()
    favourite: boolean;




}


// export class UpdateInterviewDto extends PartialType(CreateInterviewDto) {}
