// forget-password.dto.ts
import { IsEmail,IsOptional,IsNotEmpty } from 'class-validator';

export class ForgetPasswordDto {
  @IsEmail()
  email: string;
}
