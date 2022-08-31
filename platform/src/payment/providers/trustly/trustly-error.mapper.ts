
import { GeneralError } from '../../../core';
import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { TrustlyError } from '../../../integration/trustly';
import { PaymentMethodExpiredError } from '../../errors';

@Singleton
@LogClass()
export class TrustlyErrorMapper {
    public map(error: Error): Error {
        if (error instanceof TrustlyError) {
            const err = error.errors[0];

            switch (error.statusCode) {
                default:
                    return new GeneralError(err.message);

                case 400:
                    switch (err.code) {
                        case 200:
                            return new PaymentMethodExpiredError();
                    }
            }
        }

        return error;
    }
}