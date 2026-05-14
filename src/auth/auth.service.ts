import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from "bcrypt"; // pattern adapter

import { User } from './entities/user.entity';
import { LoginUserDto, CreateUserDto } from './dto';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) { }

  async create(createUserDto: CreateUserDto) {

    try {

      const { password, ...userData } = createUserDto;

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10)
      });

      await this.userRepository.save(user);

      return user;
      // TODO: JWT access
    } catch (error) {
      // console.log(error);

      this.handleDBExceptions(error)
    }
  }

  async login(loginUserDto: LoginUserDto) {

    const { password, email } = loginUserDto; // find o findOne

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true }
    });

    if (!user) throw new UnauthorizedException('Credentials not valid (email)')

    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('Credentials are not valid (pwd)')

    return user;
    // todo: JWT

  }

  private handleDBExceptions(error: any): never {

    if (error.code === '23505')
      throw new BadRequestException(error.detail)

    // this.logger.error(error); // log inside nosotros
    console.log(error);
    throw new InternalServerErrorException('Unexpected error, check server logs')
  }
}
