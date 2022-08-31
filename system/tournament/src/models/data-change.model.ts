export interface DataInsert<T> {
    action: 'INSERT';
    newData: T;
}

export interface DataDelete<T> {
    action: 'DELETE';
    oldData: T;
}

export interface DataUpdate<T> {
    action: 'UPDATE';
    oldData: T;
    newData: T;
}
export type DataChange<T> = DataInsert<T> | DataDelete<T> | DataUpdate<T>;
