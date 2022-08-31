import { Singleton } from '../../core/ioc';
import { SkinEntity } from './skin.entity';
import { Skin } from '../skin';

@Singleton
export class SkinEntityMapper {
    public fromEntity(source: SkinEntity): Skin {
        return {
            id: source.id,
            name: source.name,
            userPoolId: source.userPoolId,
            domain: source.domain,
            enabled: source.enabled,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}