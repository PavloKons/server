// forget-password.dto.ts
import { IsEmail,IsOptional,IsNotEmpty } from 'class-validator';

export class VerifyOtp {
  
  @IsEmail({}, { message: 'Invalid email address' })
    email: string

  @IsOptional()
  @IsNotEmpty()
  otp: string;
}
