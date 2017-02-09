"use strict";
const request = require("request-promise");
class FlowdockAdapter {
    postToInbox(item) {
        const requestOpts = {
            body: item,
            json: true,
            url: `https://api.flowdock.com/messages/team_inbox/${item.roomId}`,
        };
        request.post(requestOpts).catch((err) => {
            console.log(`FlowdockAdapter failed to post to Flowdock:\n${err.message}`);
        });
    }
}
exports.FlowdockAdapter = FlowdockAdapter;

//# sourceMappingURL=flowdock.js.map
