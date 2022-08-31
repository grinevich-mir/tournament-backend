import { Singleton, IocContainer } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { lambdaHandler } from '@tcom/platform/lib/core';

@Singleton
@LogClass()
class CustomSmsSenderHandler {
    public execute(event: any): void {
        console.log(event);
    }
}

export const customSmsSender = lambdaHandler((event) => IocContainer.get(CustomSmsSenderHandler).execute(event));