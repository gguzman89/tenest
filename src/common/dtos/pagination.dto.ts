import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsPositive, Min } from "class-validator";






export class PaginationDTO {

    @ApiProperty({
        default: 10,
        description: 'how many do you need?'
    })
    @IsOptional()
    @IsPositive()
    @Type(() => Number) // enableImplicitConversions: true
    limit?: number;

    @ApiProperty({
        default: 0,
        description: 'how many do you skip?'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    offset?: number
}


