import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './application/auth.service';
import { PasswordRecoveryMailService } from './application/password-recovery-mail.service';
import { AuthController } from './presentation/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.secret'),
        signOptions: {
          expiresIn: 7200,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordRecoveryMailService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
