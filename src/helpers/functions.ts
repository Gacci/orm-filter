
import { Parser } from './parser';
import { FilterQuery } from '../types/filter-query';
import { Operator } from '../enums/operator.enum';

// import { Operator } from './enums/operator.enum';

const parser = new Parser();

export const generateORMFilter = (query: string) => {
    return parser.extract(query)
        .map((filter: FilterQuery) =>
            fromObjectMongoExpression(filter)
        );
};

const toMongoExpression = function (filter: FilterQuery, op) {
  if (!filter.multi || !Array.isArray(filter.value)) {
    return { [filter.field]: { [op]: filter.value } };
  }

  return {
    [filter.delimiter === '|' ? '$or' : '$and']: (<any[]>filter.value).map(
      (value) => ({ [filter.field]: { [op]: value } })
    ),
  };
};

const fromObjectMongoExpression = function (filter: FilterQuery) {
  switch (filter.operator) {
    case Operator.eq:
      return toMongoExpression(filter, '$eq');
    case Operator.ne:
      return toMongoExpression(filter, '$ne');
    case Operator.gt:
      return toMongoExpression(filter, '$gt');
    case Operator.gte:
      return toMongoExpression(filter, '$gte');
    case Operator.lt:
      return toMongoExpression(filter, '$lt');
    case Operator.lte:
      return toMongoExpression(filter, '$lte');
    case Operator.between:
      return {
        $and: [
          { [filter.field]: { $gt: filter.value[0] } },
          { [filter.field]: { $lt: filter.value[1] } },
        ],
      };
    case Operator.notBetween:
      return {
        $or: [
          { [filter.field]: { $lt: filter.value[0] } },
          { [filter.field]: { $gt: filter.value[1] } },
        ],
      };
    case Operator.in:
      return { [filter.field]: { $in: filter.value } };
    case Operator.notIn:
      return { [filter.field]: { $nin: filter.value } };
    case Operator.regex:
      return { [filter.field]: { $regex: filter.value, $options: 'i' } };
    case Operator.notRegex:
      return {
        [filter.field]: { $not: { $regex: filter.value, $options: 'i' } },
      };
    case Operator.isNot:
      return { [filter.field]: { $exists: false } };
    case Operator.is:
      return { [filter.field]: { $exists: true } };
    // default:
    // throw new Error(`Unsupported operator: ${filter.operator}`);
  }
};
