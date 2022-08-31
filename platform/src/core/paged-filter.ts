export interface PagedFilter<T> {
    page?: number;
    pageSize?: number;
    order?: { [P in keyof T]?: 'ASC' | 'DESC' | 1 | -1 };
}