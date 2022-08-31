export class PagedResult<T> {
    public readonly items: T[];
    public readonly pageCount: number;

    constructor(
        items: T[],
        public readonly totalCount: number,
        public readonly page: number,
        public readonly pageSize: number) {
        this.items = items;
        this.pageCount = Math.ceil(totalCount / pageSize);
    }
}