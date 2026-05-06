import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginationDTO } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid'
import { ProductImage, Product } from './entities';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly datasource: DataSource,

  ) { }

  async create(createProductDto: CreateProductDto) {

    try {
      const { images = [], ...productDetails } = createProductDto; // operator rest ...

      const product = this.productRepository.create({
        ...productDetails, // operator spreet ...
        images: images.map(image => this.productImageRepository.create({ url: image }))
      });
      await this.productRepository.save(product);

      return { ...product, images };
    } catch (error) {
      this.handleDBExceptions(error)
    }

  }

  async findAll(paginationDto: PaginationDTO) {

    const { limit = 10, offset = 5 } = paginationDto

    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      },
      order: {
        slug: 1
      }
    });

    return products.map(product => ({
      ...product,
      images: product.images.map(img => img.url)
    }))
  }

  async findOne(term: string) {

    // console.log(id);

    let product: Product;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term })
    } else {
      // product = await this.productRepository.findOneBy({ slug: term })
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where(`LOWER(title) =:title or slug =:slug`, {
          title: term.toLowerCase(),
          slug: term.toLowerCase()
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();

    }

    // const product = await this.productRepository.findBy({ id })
    if (!product) throw new NotFoundException(`Product not found w/ ${term}`)

    return product;
  }

  async findOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term);
    return {
      ...rest,
      images: images.map(img => img.url)
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({ id, ...toUpdate });

    if (!product) throw new NotFoundException(`Product with id: ${id} not found`);

    // Create Query Runner
    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });

        product.images = images.map(
          image => this.productImageRepository.create({ url: image })
        )
      } else {
        // ???
      }

      await queryRunner.manager.save(product);
      // await this.productRepository.save(product)

      await queryRunner.commitTransaction();
      await queryRunner.release();

      // return product;
      return this.findOnePlain(id);
    } catch (error) {

      await queryRunner.rollbackTransaction();
      await queryRunner.release();

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

  async deleteAllProducts() {

    const query = this.productRepository.createQueryBuilder('product');

    try {

      return await query
        .delete()
        .where({})
        .execute();
    } catch (error) {

      this.handleDBExceptions(error);
    }
  }
}
