import { IsBoolean, IsDefined, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnswerDto {
    @IsMongoId()
    @ApiProperty({ example: 'question_id', description: 'The description_id'})
    question_id: string;

    @IsOptional()
    @ApiProperty({ example: 'video_url', description: 'The video_url'})
    video_url: string;

    @IsOptional()
    @ApiProperty({ example: 'duration', description: 'The duration'})
    @IsString()
    duration: string;

    @IsOptional()
    @ApiProperty({ example: 'isWathed', description: 'This is watched'})
    @IsString()
    isWatched: string;

    @IsOptional()
    @IsString()
    SVid: string;

    @IsOptional()
    @IsString()
    thumbnail: string;

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