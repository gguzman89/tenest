import { Controller, Get, Post, Param, UploadedFile, UseInterceptors, BadRequestException, Res } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileFilter, fileNamer } from './helpers';
import { diskStorage } from 'multer';
import { type Response } from 'express';
import { ConfigService } from '@nestjs/config';


@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService
  ) { }

  @Get('product/:imageName')
  findProductImage(
    @Res() res: Response, // control de la response
    @Param('imageName') imageName: string
  ) {

    const path = this.filesService.getStaticProductImage(imageName);

    res.sendFile(path);
  }

  @Post('product')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter,
    // limits: { fileSize: 1000 } bytes
    storage: diskStorage({
      destination: './static/products',
      filename: fileNamer
    })
  }))
  uploadProductImage(
    @UploadedFile() file: Express.Multer.File
  ) {

    if (!file) {
      throw new BadRequestException('Make sure that the file is an image.')
    }

    // http://localhost:3000/api/files/product/3bd839c3-a1fa-46d9-a7a8-375b16008af2.png
    const secureUrl = `${this.configService.get('HOST_API')}/files/product/${file.filename}`;

    return { secureUrl };
  }
}
