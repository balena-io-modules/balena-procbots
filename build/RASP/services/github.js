"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../helpers");
class GithubConstructorGenerator {
    static enterGithubListenerConstructor(_ctx, _bot) {
        GithubConstructorGenerator.serviceConstructor = {};
    }
    static exitGithubListenerConstructor(ctx, bot) {
        if (bot.currentService) {
            bot.currentService.constructor = GithubConstructorGenerator.serviceConstructor;
            console.log(bot.currentService);
        }
    }
    static exitGithubListenerConstructorType(ctx, bot) {
        helpers_1.MatchAssignByKeyword('port', ctx.text, GithubConstructorGenerator.serviceConstructor, ctx.INT());
        helpers_1.MatchAssignByKeyword('path', ctx.text, GithubConstructorGenerator.serviceConstructor, ctx.path());
    }
    static enterGithubLogin(ctx, bot) {
        GithubConstructorGenerator.serviceConstructor.login = {};
    }
    static exitGithubAppLogin(ctx, bot) {
        helpers_1.MatchAssignByKeyword('appId', ctx.text, GithubConstructorGenerator.serviceConstructor.login, ctx.INT());
        helpers_1.MatchAssignByKeyword('secret', ctx.text, GithubConstructorGenerator.serviceConstructor.login, ctx.HEX());
        helpers_1.MatchAssignByKeyword('pem', ctx.text, GithubConstructorGenerator.serviceConstructor.login, ctx.ALPHA());
    }
}
exports.GithubConstructorGenerator = GithubConstructorGenerator;

//# sourceMappingURL=github.js.map
