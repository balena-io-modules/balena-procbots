import * as _ from 'lodash';

export function MatchAssignByKeyword(keyword: string, value: string, assignTo: any, assignValue: any) {
    if (_.startsWith(value, keyword)) {
        assignTo[keyword] = assignValue.text;
    }
}

export function GetSingletonFromRulePotentials(...potentials: any[]) {
    // This assumes that there can only be one match in the potentials.
    for (let index = 0; index < potentials.length; index++) {
        if (potentials[index]) {
            return potentials[index];
        }
    }
}
