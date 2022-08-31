import { OrderByCondition } from 'typeorm';

export function convertOrdering<T>(alias: string, order: { [P in keyof T]?: 'ASC' | 'DESC' | 1 | -1 }): OrderByCondition {
    const result: OrderByCondition = {};
    const expressionMap = order as { [P: string]: 'ASC' | 'DESC' | 1 | -1 };

    for (const key of Object.keys(expressionMap)) {
        let direction: 'ASC' | 'DESC' = 'ASC';
        const item = expressionMap[key];

        if (typeof item === 'number')
            direction = item === 1 ? 'ASC' : 'DESC';
        else
            direction = item;

        result[`${alias}.${key}`] = direction;
    }

    return result;
}