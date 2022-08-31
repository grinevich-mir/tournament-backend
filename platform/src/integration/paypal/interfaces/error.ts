export enum PayPalErrorType {
    InternalServerError = 'INTERNAL_SERVER_ERROR',
    AuthenticationFailure = 'AUTHENTICATION_FAILURE',
    InvalidRequest = 'INVALID_REQUEST',
    NotAuthorized = 'NOT_AUTHORIZED',
    ResourceNotFound = 'RESOURCE_NOT_FOUND',
    UnprocessableEntity = 'UNPROCESSABLE_ENTITY'
}

export enum PayPalErrorIssueType {
    InvalidAccountStatus = 'INVALID_ACCOUNT_STATUS',
    InvalidParameterValue = 'INVALID_PARAMETER_VALUE',
    MissingRequiredParameter = 'MISSING_REQUIRED_PARAMETER',
    InvalidStringLength = 'INVALID_STRING_LENGTH',
    ConstentNeed = 'CONSENT_NEEDED',
    PermissionDenied = 'PERMISSION_DENIED',
    InvalidResourceId = 'INVALID_RESOURCE_ID',
    AgreementAlreadyCancelled = 'AGREEMENT_ALREADY_CANCELLED',
    BillingAgreementNotFound = 'BILLING_AGREEMENT_NOT_FOUND',
    ComplianceViolation = 'COMPLIANCE_VIOLATION',
    DomesticTransactionRequired = 'DOMESTIC_TRANSACTION_REQUIRED',
    DuplicateInvoiceId = 'DUPLICATE_INVOICE_ID',
    InstrumentDeclined = 'INSTRUMENT_DECLINED',
    OrderNotApproved = 'ORDER_NOT_APPROVED',
    MaxPaymentAttemptsExceeded = 'MAX_NUMBER_OF_PAYMENT_ATTEMPTS_EXCEEDED',
    PayeeBlockedTransaction = 'PAYEE_BLOCKED_TRANSACTION',
    PayerAccountLockedOrClosed = 'PAYER_ACCOUNT_LOCKED_OR_CLOSED',
    PayerAccountRestricted = 'PAYER_ACCOUNT_RESTRICTED',
    PayerCannotPay = 'PAYER_CANNOT_PAY',
    TransactionLimitExceeded = 'TRANSACTION_LIMIT_EXCEEDED',
    TransactionRecieivingLimitExceeded = 'TRANSACTION_RECEIVING_LIMIT_EXCEEDED',
    TransactionRefused = 'TRANSACTION_REFUSED',
    RedirectPayerToAlternateFunding = 'REDIRECT_PAYER_FOR_ALTERNATE_FUNDING',
    OrderAlreadyCaptured = 'ORDER_ALREADY_CAPTURED',
    TransactionBlockedByPayee = 'TRANSACTION_BLOCKED_BY_PAYEE',
    AuthCaptureNotEnabled = 'AUTH_CAPTURE_NOT_ENABLED',
    NotEnabledForCardProcessing = 'NOT_ENABLED_FOR_CARD_PROCESSING',
    PayeeNotEnabledForCardProcessing = 'PAYEE_NOT_ENABLED_FOR_CARD_PROCESSING',
    ShippingAddressInvalid = 'SHIPPING_ADDRESS_INVALID'
}

export interface PayPalErrorIssueDetails {
    issue: PayPalErrorIssueType;
    description: string;
}

export interface PayPalErrorResponse {
    name: PayPalErrorType;
    message: string;
    details: PayPalErrorIssueDetails[];
}