import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserLoginDto } from './dto/login-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
//importing bcrypt password config
import { comparePassword, hashPassword } from '../utils/bcrypt';
import { AuthService } from '../auth/auth.service';
import { MessagingService } from 'src/messaging/services/messaging.service';
import { MediaService } from 'media/services/media.service';
import * as sgMail from '@sendgrid/mail';
import * as otpGenerator from 'otp-generator';
import { VerifyOtp } from './dto/verify-otp.dto';
import { Otp } from 'src/otp.entity';
import { UserUpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private UserModel: Model<User>,
    @InjectModel('Otp') private OtpModel: Model<Otp>,
    private readonly authService: AuthService,
    private readonly messagingService: MessagingService,
    private readonly mediaService: MediaService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User | null> {
    if (await this.findOne(createUserDto.email)) {
      throw new ConflictException('User already exists');
    }
    if (createUserDto.password !== createUserDto.confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }
    createUserDto.password = await hashPassword(createUserDto.password);
    const createdUser = await this.UserModel.create(createUserDto);
    // Exclude the password field from the returned user object
    return createdUser.toObject({
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    }) as User;
  }

  async findAll(): Promise<User[] | []> {
    return await this.UserModel.find().select('-password');
  }

  async findById(id: string): Promise<User | null> {
    let user: User | null = await this.UserModel.findById(id).select(
      '-v -password',
    );
    if (!user) throw new NotFoundException('user not found');
    return user;
  }

  async findOne(email: string): Promise<User | null> {
    return await this.UserModel.findOne({ email });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    file: Express.Multer.File,
  ) {
    let user;
  
    if (!(await this.UserModel.findById(id))) {
      throw new NotFoundException('User not found');
    }
  
    const isPasswordSet = await this.isPasswordSet(id);
  
    if (!isPasswordSet.isPassword && !updateUserDto.current_password) {
      throw new BadRequestException('Current password is required');
    }
  
    if (updateUserDto.current_password) {
      const existingUser = await this.UserModel.findById(id).select('password');
  
      if (!existingUser || !(await comparePassword(updateUserDto.current_password, existingUser.password))) {
        throw new BadRequestException('Invalid current password');
      }
    }
  
    if (updateUserDto.password) {
      const hashedPassword = await hashPassword(updateUserDto.password);
      updateUserDto.password = hashedPassword;
    }
  
    if (file) {
      const profileImageUrl = this.mediaService.saveProfileImage(file);
      user = await this.UserModel.findById(id);
      user.profile_image = profileImageUrl;
      await user.save();
    }
  
    const updatedData = await this.UserModel.findByIdAndUpdate(
      id,
      updateUserDto,
      {
        new: true,
      },
    ).select('-password');
  
    updatedData['id'] = updatedData._id;
    return updatedData;
  }
  
  
  async remove(id: string): Promise<User | null> {
    return await this.UserModel.findByIdAndRemove(id);
  }

  async login(userLoginDto: UserLoginDto) {
    let user: User | null = await this.findOne(userLoginDto.email);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    if (!(await comparePassword(userLoginDto.password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }
    const jwtToken = await this.authService.generateToken({
      id: user.id,
      // role: user.role,
    });
    const chatUser = await this.messagingService.initializeUser(user.id);
    const isPassword = await this.isPasswordSet(user.id);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      location: user.location,
      company_name: user.company_name,
      profile_image: user.profile_image || null,
      isPassword,
      // role: user.role,
      token: jwtToken,
      chat: {
        user: chatUser.user,
        token: chatUser.token,
      },
    };
  }

  // async updatePassword(
  //   email: string,
  //   newPassword: string,
  // ): Promise<User | null> {
  //   const user = await this.UserModel.findOne({ email });
  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }
  //   user.password = await hashPassword(newPassword);
  //   const updatedUser = await user.save();
  //   return updatedUser;
  // }

  async socialLogin(socialUserData: any): Promise<any> {
    const { name, email } = socialUserData;
    let user = await this.UserModel.findOne({ email });


    if (!user) {
      user = await this.UserModel.create({
        name,
        email,
      });

    }
    const jwtToken = await this.authService.generateToken({
      id: user.id,
    });
    const chatUser = await this.messagingService.initializeUser(user.id);
    const isPassword = await this.isPasswordSet(user.id);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profile_image: user.profile_image || null,
      token: jwtToken,
      isPassword,
      chat: {
        user: chatUser.user,
        token: chatUser.token,
      },
    };
  }

  // async me(authorization: string, isSocialLogin: boolean = false): Promise<any> {
  //   if (!authorization || !authorization.startsWith('Bearer ')) {
  //     throw new UnauthorizedException('Invalid token format');
  //   }
  //   const token = authorization.split(' ')[1];
  //   try {
  //     const decodedToken = await this.authService.verifyToken(token);
  //     if (this.authService.isTokenExpired(decodedToken)) {
  //       throw new UnauthorizedException('Token has expired');
  //     }

  //     let user = await this.UserModel.findById(decodedToken.id).select(
  //       '-v -password',
  //     );
  //     if (!user) throw new NotFoundException('user not found');
  //     const jwtToken = await this.authService.generateToken({
  //       id: user.id,
  //     });

  //     const chatUser = await this.messagingService.initializeUser(user.id);

  //     return {
  //       id: user.id,
  //       name: user.name,
  //       email: user.email,
  //       location: user.location,
  //       company_name: user.company_name,
  //       profile_image: user.profile_image || null,
  //       token: jwtToken,
  //       chat: {
  //         user: chatUser.user,
  //         token: chatUser.token,
  //       },
  //     };
  //   } catch (error) {
  //     throw new UnauthorizedException('Invalid token');
  //   }
  // }
  async me(authorization: string, isSocialLogin: boolean = false): Promise<any> {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid token format');
    }
    const token = authorization.split(' ')[1];
    try {
      const decodedToken = await this.authService.verifyToken(token);
      if (this.authService.isTokenExpired(decodedToken)) {
        throw new UnauthorizedException('Token has expired');
      }
  
      let user = await this.UserModel.findById(decodedToken.id).select(
        '-v -password',
      );
      if (!user) throw new NotFoundException('User not found');
  
      const jwtToken = await this.authService.generateToken({
        id: user.id,
      });
  
      const chatUser = await this.messagingService.initializeUser(user.id);
      const isPassword = await this.isPasswordSet(user.id);

      const response: any = {
        id: user.id,
        name: user.name,
        email: user.email,
        location: user.location,
        company_name: user.company_name,
        profile_image: user.profile_image || null,
        token: jwtToken,
        isPassword,
        chat: {
          user: chatUser.user,
          token: chatUser.token,
        },
      };
  
      if (isSocialLogin) {
        response.social = true;

      } else {
        response.social = false;

      }
    
      return response;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
  
  async isPasswordSet(userId: string): Promise<{ isPassword: boolean }> {
    try {
      const user = await this.UserModel.findById(userId).select('password');
  
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      return { isPassword: user.password === null || user.password === undefined };
    } catch (error) {
      throw error;
    }
  }

  
// udpate password
async updatePassword(res,UserUpdatePasswordDto:UserUpdatePasswordDto):Promise<void> {
  try {
    const {email,password} = UserUpdatePasswordDto
   const user = await this.UserModel.findOne({ email: email});
   if(user){
   const hashedPassword = await hashPassword(password)
     await this.UserModel.findByIdAndUpdate(user.id, { password: hashedPassword});
     return res.status(HttpStatus.OK).json({message:"password changed successfully"})
    //  throw new HttpException(customErrorMessage, statusCode);
   }else{
    throw new NotFoundException('User not found');
   }
  } catch (error) {
    console.log(error.message)
  }

}




  // generate otp
  async generateAndStoreOtp(userId: string): Promise<void> {
    const otp = otpGenerator.generate(5, { digits: true, alphabets: false, upperCase: false, specialChars: false });
    const otpDocument = await this.OtpModel.create({ userId, otp });
    // Add your logic to send the OTP to the user (e.g., via email or SMS)
    // For simplicity, let's log the OTP here
    console.log(`Generated OTP for user ${userId}: ${otp}`);
    return otp;
  }

  //verify token
  async verifyOtp(@Res() res,userId: string, userEnteredOtp: string): Promise<void> {
    const otpDocument = await this.OtpModel.findOne({ userId, otp: userEnteredOtp });
    if (!otpDocument) {
     return res.status(HttpStatus.BAD_REQUEST).json({message: "Invalid OTP"})
    }
    // OTP is valid, perform the necessary actions
    // Remove the used OTP from the database
    await this.OtpModel.findByIdAndDelete(otpDocument._id);
    return res.status(HttpStatus.OK).json({message: "OTP Verified Successfully"})
  }

  async VerifyOtpWithEmail(res,VerifyOtp:VerifyOtp): Promise<void> {
    const {email,otp} = VerifyOtp
    try {
      const user = await this.UserModel.findOne({email: email});
      if(user){
        this.verifyOtp(res,user.id,otp)
      }else{
        res.status(HttpStatus.OK).json({message: "User not found"})
      }
    } catch (error) {
      console.log(error)
    }
  }

  // forget password
async sendForgetPasswordEmail(res,email: string): Promise<void> {

    // Check if the user with the provided email exists
    try {
       const user = await this.UserModel.findOne({email});
    if (user) {     
    console.log("user found")
    const otp = await this.generateAndStoreOtp(user._id);
     console.log("this is ", otp);
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log("generate email")
    const msg = {
        to: email,
        from: `${process.env.SENDGRID_VERIFIED_EMAIL}`, // Replace with your verified sender email
        subject: 'Forget Password Request',
        html: `
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    .header {
      background-color: #007bff;
      padding: 20px;
      text-align: center;
    }
.header h2{
   color: #ffffff;
}
    .content {
      padding: 20px;
    }

    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #007bff;
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
    }
    
    .footer {
      background-color: #f5f5f5;
      padding: 10px;
      text-align: center;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Forgot Password</h2>
    </div>
    <div class="content">
      <p>Dear ${user.name},</p>
      <p>We received a request to reset the password for your <a href=${process.env.FRONT_END_URL}>Video Interview</a> account. To proceed with the password reset, enter the otp given below:</p>
      <h1>${otp}</h1>
      <p>this otp is only valid for 10 minutes</p>
      <p>If you did not request a password reset, please ignore this email. Your account remains secure.</p>
    </div>
    <div class="footer">
      <p>Thank you, <br> The <a href=${process.env.FRONT_END_URL}>Video Interview</a> Team</p>
    </div>
  </div>
</body>
</html>`,
      };
      await sgMail.send(msg);
      console.log("Forget password email sent successfully to:", email);
      res.json({message:"email sent successfully"})

        }else{
     console.log("user not found")
   return res.json({message:"User Not Found"})
   }
    } catch (error) {
      console.log(error.message)
      return error.message;
    }

  }


      
}
