export interface EthTransactionModel {
    id: number;
    completeTime?: Date;
    userId:number;
    transectionId:string;
    accountId:string;
    orderId:string;
    transactionAmount:string;
    status:number;
    TransactionStatus:string;
    TotalAmount:string;
    TransactionDateTime:string;
    TransactionResponseJson:string;
     UserRequestJson:string;
     transactionLogId:string;
}