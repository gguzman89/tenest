import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsPositive, Min } from "class-validator";






export class PaginationDTO {

    @IsOptional()
    @IsPositive()
    @Type(() => Number) // enableImplicitConversions: true
    limit?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    offset?: number
}


