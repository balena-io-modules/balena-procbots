"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
function MatchAssignByKeyword(keyword, value, assignTo, assignValue) {
    if (_.startsWith(value, keyword)) {
        assignTo[keyword] = assignValue.text;
    }
}
exports.MatchAssignByKeyword = MatchAssignByKeyword;
function GetSingletonFromRulePotentials(...potentials) {
    for (let index = 0; index < potentials.length; index++) {
        if (potentials[index]) {
            return potentials[index];
        }
    }
}
exports.GetSingletonFromRulePotentials = GetSingletonFromRulePotentials;

//# sourceMappingURL=helpers.js.map
