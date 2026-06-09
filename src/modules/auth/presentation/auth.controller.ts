import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateRecoveryCodeDto } from './dto/validate-recovery-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordRecovery(dto.email);
  }

  @Post('validate-recovery-code')
  validateRecoveryCode(@Body() dto: ValidateRecoveryCodeDto) {
    return this.authService.validateRecoveryCode(dto.email, dto.codigo);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.email,
      dto.codigo,
      dto.password,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return { user };
  }
}
