export enum GameResponseCode {
    Success = 200,
    BadRequest = 199,
    WrongSignature = 1403,
    InternalError = 1500,
    UserNotFound = 1501,
    InvalidToken = 1502,
    InsufficientFunds = 1503,
    TransactionDeclined = 1504
}