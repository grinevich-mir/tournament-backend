export * from 'typescript-ioc';
import { Container } from 'typescript-ioc';

export type Newable<T> = new (...args: any[]) => T;

export interface Abstract<T> {
     prototype: T;
}

export type ServiceIdentifier<T> = (string | symbol | Newable<T> | Abstract<T>);

export class IocContainer {
    public static get<T>(serviceIdentifier: ServiceIdentifier<T>): T {
        return Container.get(serviceIdentifier as () => void) as T;
    }
}