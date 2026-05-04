import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { PaginationDTO } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid'

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>

  ) { }

  async create(createProductDto: CreateProductDto) {

    try {

      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);

      return product;
    } catch (error) {
      this.handleDBExceptions(error)
    }

  }

  async findAll(paginationDto: PaginationDTO) {

    const { limit = 10, offset = 5 } = paginationDto

    return await this.productRepository.find({
      take: limit,
      skip: offset,
      //TODO: relaciones
      order: {
        slug: 1
      }
    });
  }

  async findOne(term: string) {

    // console.log(id);

    let product: Product;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term })
    } else {
      // product = await this.productRepository.findOneBy({ slug: term })
      const queryBuilder = this.productRepository.createQueryBuilder();
      product = await queryBuilder
        .where(`LOWER(title) =:title or slug =:slug`, {
          title: term.toLowerCase(),
          slug: term.toLowerCase()
        }).getOne();

    }

    // const product = await this.productRepository.findBy({ id })
    if (!product) throw new NotFoundException(`Product not found w/ ${term}`)

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto
    });

    if (!product) throw new NotFoundException(`Product with id: ${id} not found`);

    try {

      await this.productRepository.save(product)
      return product;
    } catch (error) {

      this.handleDBExceptions(error)
    }

  }

  async remove(id: string) {

    const { affected, } = await this.productRepository.delete({ id })

    if (affected === 0) throw new BadRequestException(`Product with ID not found`)

    return;
  }

  private handleDBExceptions(error: any) {

    if (error.code === '23505')
      throw new BadRequestException(error.detail)

    this.logger.error(error); // log inside nosotros
    // console.log(error);
    throw new InternalServerErrorException('Unexpected error, check server logs')
  }
}
