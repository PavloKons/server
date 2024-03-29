import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Headers,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserLoginDto } from './dto/login-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileSizeValidationPipe } from 'media/decorators/file-size.decorator';
import { MediaTypeValidationPipe } from 'media/decorators/media-type.decorator';
import { UserUpdatePasswordDto } from './dto/update-password.dto';
import { VerifyOtp } from './dto/verify-otp.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';


@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('sign-up')
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get('me')
  async me(@Headers('authorization') authorization: string) {
    return await this.usersService.me(authorization);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.usersService.findById(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    // @UploadedFile() file: Express.Multer.File,
    @UploadedFile(FileSizeValidationPipe, MediaTypeValidationPipe) file: Express.Multer.File,

  ) {
    return await this.usersService.update(id, updateUserDto, file);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.usersService.remove(id);
  }

  @Post('log-in')
  async login(@Body() userLoginDto: UserLoginDto) {
    return await this.usersService.login(userLoginDto);
  }

  @Get('/token/auth')
  @UseGuards(JwtAuthGuard)
  async auth(@Request() req) {
    return await this.usersService.findById(req.user.id);
  }

  @Get(':id/password')
async getPassword(@Param('id') id: string) {
  return await this.usersService.isPasswordSet(id);
}


   //update password
  @Post('update-password')
  async UserUpdatePasswordDto(@Res() res,@Body() UserUpdatePasswordDto: UserUpdatePasswordDto) {
    return await this.usersService.updatePassword(res,UserUpdatePasswordDto);
  }

  
// verify otp
   @Post('verifyOtp')
  async verifyOtp(@Res() res,@Body() VerifyOtp:VerifyOtp) {
    return await this.usersService.VerifyOtpWithEmail(res,VerifyOtp);
  }

// forget password
  @Post('forget-password')
 async forgetPassword(@Res() res, @Body() forgetPasswordDto: ForgetPasswordDto) {
   await this.usersService.sendForgetPasswordEmail(res,forgetPasswordDto.email);
}

}
