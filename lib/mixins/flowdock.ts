import * as request from 'request-promise';
import { FlowdockInboxItem } from './flowdock-types';

export class FlowdockAdapter {
    public postToInbox(item: FlowdockInboxItem) {
        //  Make a straight post to the inbox from the client.
        const requestOpts = {
            body: item,
            json: true,
            url: `https://api.flowdock.com/messages/team_inbox/${item.roomId}`,
        };

        // If we aren't outputting to Flowdock (development build, test build, etc)
        // just return.
        // People invariably use different cases, so...
        if (process.env.FLOWDOCK_ALERTS && (process.env.FLOWDOCK_ALERTS.toLowerCase() === 'true')) {
            // We don't wait for a response, we have no control over it anyway.
            request.post(requestOpts);
        }
    }
}
