import {
  BadRequestException,
  ExecutionContext,
  Type,
  createParamDecorator,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ValidatorOptions, validate } from 'class-validator';

import { FilterQuery } from '../types/filter-query';
import { Parser } from '../helpers/parser';
import { fromObjectMongoExpression } from '../helpers/functions';
// import { generateORMFilter } from "../helpers/functions";

const parser = new Parser();

/**
 *
 * @param page
 * @param size
 * @returns
 */
const getPaginationObject = function (page: any, size: any) {
  const limit = !isNaN(size) && isFinite(size) ? +size : 50;

  const skip = !isNaN(page) && isFinite(page) ? +page * limit : 0;

  return { skip, limit };
};

/**
 *
 * @param sort
 * @returns
 */
const getSortingObject = function (sort: string = '', strict?: boolean) {
  return Object.fromEntries(
    sort
      .split(',')
      .map((exp: string) => exp?.split(':'))
      .filter(([k, v]) => k?.length)
      .map(([k, v]) => [k, v ? v : 'asc'])
      .map(([k, v]) => [
        k, 
        v === 'asc' ? 1 : 
        v === 'desc' ? -1 : 
        void 0
      ])
  );
};

/**
 *
 * @param assoc
 * @returns
 */
const getProjectionObject = function (assoc: string = '') {
  return assoc.split(',').filter((exp: string) => exp?.length);
};

export type FilterOptions = { filter?: string; filterAsArray?: boolean };

/**
 *
 * @param DtoClass
 * @param opts
 * @returns
 */
export const GenerateORMFilter = (
  DtoClass?: Type<any>,
  opts?: FilterOptions,
  validator?: ValidatorOptions
) =>
  createParamDecorator(async (data: unknown, ctx: ExecutionContext) => {
    opts = opts ?? { filter: 'filter' };

    const { query } = ctx.switchToHttp().getRequest();
    const object = parser.extract(query[opts.filter] ?? '');

    const sort = getSortingObject(query.sort);
    const projection = getProjectionObject(query.assoc);

    const dto = plainToInstance(DtoClass, {
      projection,
      sort,
      ...object.reduce(
        (accum: { [key: string]: FilterQuery }, filter: FilterQuery) => ({
          ...accum,
          [filter.field]: filter.value,
        }),
        {}
      ),
    });

    const errors = await validate(dto, validator);
    if (errors?.length) {
      throw new BadRequestException(
        errors.map((e) => Object.values(e.constraints))
      );
    }

    const filter = object.map((filter: FilterQuery) =>
      fromObjectMongoExpression(filter)
    );

    const options = {
      sort,
      ...getPaginationObject(query.page, query.limit),
    };

    if (opts?.filterAsArray) {
      return { projection, options, filter };
    }

    return {
      projection,
      options,
      filter: filter.reduce(
        (stack: { [key: string]: FilterQuery }, filter) => ({
          ...stack,
          ...filter,
        }),
        {}
      ),
    };
  })();
