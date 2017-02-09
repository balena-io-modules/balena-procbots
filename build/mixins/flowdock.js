"use strict";
const request = require("request-promise");
class FlowdockAdapter {
    postToInbox(item) {
        const requestOpts = {
            body: item,
            json: true,
            url: `https://api.flowdock.com/messages/team_inbox/${item.roomId}`,
        };
        if (process.env.FLOWDOCK_ALERTS && (process.env.FLOWDOCK_ALERTS.toLowerCase() === 'true')) {
            request.post(requestOpts);
        }
    }
}
exports.FlowdockAdapter = FlowdockAdapter;

//# sourceMappingURL=flowdock.js.map
