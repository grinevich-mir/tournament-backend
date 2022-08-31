import { Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import Handlebars from '../../core/handlebars';
import { TournamentIntro } from '../tournament-intro';
import { TournamentIntroModel } from '../models';

@Singleton
@LogClass()
export class TournamentIntroCompiler {
    public compile(intro: TournamentIntro, ...data: any): TournamentIntroModel {
        const context = Object.assign({}, ...data);

        return {
            topContent: this.format(intro.topContent, context),
            bottomContent: this.format(intro.bottomContent, context)
        };
    }

    private format(content: string, context: any): string {
        const template = Handlebars.compile(content);
        return template(context);
    }
}