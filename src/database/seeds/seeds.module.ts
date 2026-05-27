import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../modules/users/infrastructure/schemas/user.schema';
import { UsersSeedService } from './users.seed.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UsersSeedService],
  exports: [UsersSeedService],
})
export class SeedsModule {}
