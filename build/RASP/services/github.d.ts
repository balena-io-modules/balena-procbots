import { GithubAppLoginContext, GithubLoginContext, GithubListenerConstructorContext, GithubListenerConstructorTypeContext } from '../Antlr/RASPParser';
import { BotDetails } from '../parser-types';
export declare class GithubConstructorGenerator {
    static serviceConstructor: any;
    static enterGithubListenerConstructor(_ctx: GithubListenerConstructorContext, _bot: BotDetails): void;
    static exitGithubListenerConstructor(ctx: GithubListenerConstructorContext, bot: BotDetails): void;
    static exitGithubListenerConstructorType(ctx: GithubListenerConstructorTypeContext, bot: BotDetails): void;
    static enterGithubLogin(ctx: GithubLoginContext, bot: BotDetails): void;
    static exitGithubAppLogin(ctx: GithubAppLoginContext, bot: BotDetails): void;
}
