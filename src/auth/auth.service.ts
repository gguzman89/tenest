import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user-dto';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) { }

  async create(createUserDto: CreateUserDto) {

    try {

      const user = this.userRepository.create(createUserDto);

      await this.userRepository.save(user);

      return user;
    } catch (error) {
      // console.log(error);

      this.handleDBExceptions(error)
    }
  }

  private handleDBExceptions(error: any): never {

    if (error.code === '23505')
      throw new BadRequestException(error.detail)

    // this.logger.error(error); // log inside nosotros
    console.log(error);
    throw new InternalServerErrorException('Unexpected error, check server logs')
  }
}
