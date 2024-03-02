import { IsMongoId, IsOptional } from 'class-validator';
export class UpdateInterviewDto {
  @IsOptional()
  @IsMongoId()
  question_id: string;

  @IsOptional()
  job_title: string

  @IsOptional()
  job_recruiter: string


  @IsOptional()
  @IsMongoId()
  interview: string;
}