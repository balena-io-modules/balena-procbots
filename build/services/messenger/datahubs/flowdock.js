"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const flowdock_1 = require("flowdock");
const _ = require("lodash");
const datahub_1 = require("./datahub");
class FlowdockDataHub {
    constructor(data) {
        this.fetchUserId = (username) => {
            return this.fetchFromSession(`/organizations/${this.organization}/users`)
                .then((foundUsers) => {
                const matchingUsers = _.filter(foundUsers, (eachUser) => {
                    return eachUser.nick.toLowerCase() === username.toLowerCase();
                });
                if (matchingUsers.length === 1) {
                    return matchingUsers[0].id;
                }
            });
        };
        this.fetchFromSession = (path, search) => {
            return new Promise((resolve, reject) => {
                this.session.get(path, { search }, (error, result) => {
                    if (result) {
                        resolve(result);
                    }
                    else {
                        reject(error);
                    }
                });
            });
        };
        this.session = new flowdock_1.Session(data.token);
        this.session.on('error', () => { });
        this.organization = data.organization;
    }
    fetchValue(user, service, key) {
        const findKey = new RegExp(`My ${service} ${key} is (\\S+)`, 'i');
        return this.fetchPrivateMessages(user, findKey)
            .then((valueArray) => {
            const value = valueArray[valueArray.length - 1].match(findKey);
            if (value) {
                return value[1];
            }
            throw new datahub_1.DataHubError(0, `Could not find value $key for $user`);
        });
    }
    fetchPrivateMessages(username, filter) {
        return this.fetchUserId(username)
            .then((userId) => {
            const match = filter.source.match(/^([\w\s]+)/i);
            return this.fetchFromSession(`/private/${userId}/messages`, match ? match[1] : undefined)
                .then((fetchedMessages) => {
                return _.filter(fetchedMessages, (message) => {
                    return filter.test(message.content);
                }).map((message) => {
                    return message.content;
                });
            });
        });
    }
}
exports.FlowdockDataHub = FlowdockDataHub;
function createDataHub(data) {
    return new FlowdockDataHub(data);
}
exports.createDataHub = createDataHub;

//# sourceMappingURL=flowdock.js.map
