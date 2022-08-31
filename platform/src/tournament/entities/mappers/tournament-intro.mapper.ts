import { Singleton } from '../../../core/ioc';
import { TournamentIntroEntity } from '../tournament-intro.entity';
import { TournamentIntro } from '../../tournament-intro';
import { TournamentIntroUpdate } from '../../tournament-intro-update';

@Singleton
export class TournamentIntroEntityMapper {
    public fromEntity(source: TournamentIntroEntity): TournamentIntro {
        return {
            id: source.id,
            name: source.name,
            topContent: source.topContent,
            bottomContent: source.bottomContent,
            enabled: source.enabled,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public newToEntity(source: TournamentIntroUpdate): TournamentIntroEntity {
        const entity = new TournamentIntroEntity();
        entity.name = source.name;
        entity.topContent = source.topContent;
        entity.bottomContent = source.bottomContent;
        return entity;
    }

    public updateToEntity(id: number, source: TournamentIntroUpdate): TournamentIntroEntity {
        const entity = new TournamentIntroEntity();
        entity.id = id;
        entity.name = source.name;
        entity.topContent = source.topContent;
        entity.bottomContent = source.bottomContent;
        entity.enabled = source.enabled;
        return entity;
    }
}