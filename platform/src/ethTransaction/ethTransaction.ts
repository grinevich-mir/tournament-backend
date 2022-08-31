
export interface NewEthTransaction {
    completeTime?: Date;
    orderId:string;
    userId:number,
     transectionId:string;
     accountId:string;
     transactionAmount:string;
     status:number;
     TransactionStatus:string;
     TotalAmount:string;
     TransactionDateTime:string;
     TransactionResponseJson:string;
      UserRequestJson:string;
      transactionLogId:string;
   
}

export interface EthTransaction extends NewEthTransaction {
    id: number;
   
}