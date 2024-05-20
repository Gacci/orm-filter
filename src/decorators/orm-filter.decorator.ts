import {
  BadRequestException,
  ExecutionContext,
  Type,
  createParamDecorator,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { FilterQuery } from '../types/filter-query';
import { Parser } from '../helpers/parser';
import { fromObjectMongoExpression } from '../helpers/functions';
// import { generateORMFilter } from "../helpers/functions";

const parser = new Parser();

// export const generateORMFilter = (query: string) => {
//     return
//         .map((filter: FilterQuery) =>
//             fromObjectMongoExpression(filter)
//         );
// };

export const GenerateORMFilter = (DtoClass?: Type<any>, opts?: any) =>
  createParamDecorator(async (data: unknown, ctx: ExecutionContext) => {
    opts = opts ?? { filter: 'filter' };
    const request = ctx.switchToHttp().getRequest();

    const object = parser.extract(request.query[opts.filter] ?? '');
    const dto = plainToInstance(
      DtoClass,
      object.reduce(
        (accum, filter) => ({ ...accum, [filter.field]: filter.value }),
        {}
      )
    );

    const errors = await validate(dto, opts?.validatorOptions);
    if (errors?.length) {
      throw new BadRequestException(
        errors.map((e) => Object.values(e.constraints))
      );
    }

    const filters = object.map((filter: FilterQuery) =>
      fromObjectMongoExpression(filter)
    );

    if (opts?.filterAsArray) {
      return filters;
    }

    return filters.reduce((stack, filter) => ({ ...stack, ...filter }), {});
  })();
