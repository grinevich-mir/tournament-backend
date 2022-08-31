export interface LEMVerifyCombinationRequest {
    clientRef: string;
    redactMe: boolean;
    amlRequired: boolean;
    requestSmartsearchReport: boolean;
}

export interface LEMVerifyResponse {
    id: string;
    friendlyId: string;
    url: string;
    balance: number;
}

export interface LEMVerifyDownloadResponse {
    report: string;
    documentFront: string;
    documentBack: string;
    redactedReport: string;
    amlReport: string;
    smartsearchReport: string;
}

export interface LEMVerifyWebhookRequest {
    id: string;
    type: string;
    friendlyId: string;
    processedAt: number;
    startedAt: number;
    deletionAt: number;
    result: string;
    referMessage: string;
    balance: number;
    person: LEMVerifyPerson;
    documents: [LEMVerifyDocument];
    liveperson: LEMVerifyLiveperson;
    report: string;
    redactedReport: string;
    connections: LEMVerifyConnections;
}

export interface LEMVerifyStatusWebhookRequest {
    id: string;
    state: number;
}

export interface LEMVerifyPerson {
    title: string;
    forename: string;
    surname: string;
    gender: string;
    dob: LEMVerifyDate;
    address: LEMVerifyPersonAddress;
}

export interface LEMVerifyDate {
    day: number;
    month: number;
    year: number;
}

export interface LEMVerifyPersonAddress {
    buildingNumber: string;
    address1: string;
    address2: string;
    postTown: string;
    county: string;
    country: string;
    postCode: string;
}

export interface LEMVerifyDocument {
    type: string;
    documentNumber: string;
    expiryDate: LEMVerifyDate;
    issuingCountry: string;
    result: string;
}

export interface LEMVerifyLiveperson {
    age: number;
    gender: string;
}

export interface LEMVerifyConnections {
    smartsearch: LEMVerifySmartsearch;
}

export interface LEMVerifySmartsearch {
    report: string;
}
