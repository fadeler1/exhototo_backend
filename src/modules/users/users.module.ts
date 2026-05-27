import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { USER_REPOSITORY } from '../../common/tokens/repository.tokens';
import { UsersService } from './application/users.service';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { User, UserSchema } from './infrastructure/schemas/user.schema';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USER_REPOSITORY, useClass: UserRepository },
  ],
  exports: [UsersService, USER_REPOSITORY],
})
export class UsersModule {}
