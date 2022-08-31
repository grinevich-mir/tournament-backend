import * as env from 'env-var';
import { Singleton } from '@tcom/platform/lib/core/ioc';
import axios from 'axios';
import _ from 'lodash';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';

interface ECSMetadata {
    DockerId: string;
    Name: string;
    DockerName: string;
    Image: string;
    ImageID: string;
    Labels: {
        'com.amazonaws.ecs.cluster'?: string,
        'com.amazonaws.ecs.container-name'?: string,
        'com.amazonaws.ecs.task-arn'?: string,
        'com.amazonaws.ecs.task-definition-family'?: string,
        'com.amazonaws.ecs.task-definition-version'?: string
    };
}

@Singleton
@LogClass()
export class ECSMetadataService {
    public async getTaskId(): Promise<string> {
        const metadata = await this.getMetadata();
        const taskArn = metadata.Labels['com.amazonaws.ecs.task-arn'];

        if (!taskArn)
            throw new Error(`Could not get Task Arn from metadata.`);

        const taskId = _.last(taskArn.split('/'));

        if (!taskId)
            throw new Error('Could not retrieve task ID');

        return taskId;
    }

    private async getMetadata(): Promise<ECSMetadata> {
        const metadataUri = env.get('ECS_CONTAINER_METADATA_URI').required().asString();
        const response = await axios.get<ECSMetadata>(metadataUri);
        const metadata = response.data;
        Logger.debug(`Task Metadata`, metadata);
        return metadata;
    }
}