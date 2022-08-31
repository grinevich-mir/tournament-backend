
import { Singleton } from '../../../../core/ioc';
import { LogClass } from '../../../../core/logging';
import { PayPalError } from '../../../../integration/paypal/paypal-error';
import { PaymentAttemptsExceededError, PaymentMethodDeclinedError, PaymentError, PaymentAlreadyProcessedError, PaymentPayerAccountError } from '../../../../payment/errors';
import { PayPalErrorType, PayPalErrorIssueType } from '../../../../integration/paypal';

@Singleton
@LogClass()
export class PayPalErrorMapper {
    public map(error: Error): Error {
        if (!(error instanceof PayPalError))
            return error;

        if (!error.details)
            return new PaymentError(error.message);

        switch (error.type) {
            case PayPalErrorType.UnprocessableEntity:
                switch (error.details[0].issue) {
                    case PayPalErrorIssueType.MaxPaymentAttemptsExceeded:
                        return new PaymentAttemptsExceededError();

                    case PayPalErrorIssueType.InstrumentDeclined:
                        return new PaymentMethodDeclinedError();

                    case PayPalErrorIssueType.AgreementAlreadyCancelled:
                    case PayPalErrorIssueType.OrderAlreadyCaptured:
                        return new PaymentAlreadyProcessedError();

                    case PayPalErrorIssueType.PayerAccountLockedOrClosed:
                    case PayPalErrorIssueType.PayerAccountRestricted:
                    case PayPalErrorIssueType.PayerCannotPay:
                        return new PaymentPayerAccountError();

                    default:
                        return new PaymentError(error.message);
                }

            default:
                return new PaymentError(error.message);
        }
    }
}