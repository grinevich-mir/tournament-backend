import { Singleton, IocContainer } from '../../core/ioc';
import { VerificationProvider } from '../verification-provider';
import { VerificationGateway } from './verification-gateway';
import { LEMVerifyVerificationGateway } from './lemverify';
import { S3VerificationGateway } from './s3';

@Singleton
export class VerificationGatewayFactory {
    public create(provider: VerificationProvider): VerificationGateway {
        switch (provider) {
            case VerificationProvider.LEMVerify:
                return IocContainer.get(LEMVerifyVerificationGateway);
            case VerificationProvider.S3:
                return IocContainer.get(S3VerificationGateway);
        }

        throw new Error(`Unsupported verification provider type ${provider}.`);
    }
}
