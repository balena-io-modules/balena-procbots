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

        // We don't wait for a response, we have no control over it anyway.
        request.post(requestOpts).catch((err: Error) => {
            console.log(`FlowdockAdapter failed to post to Flowdock:\n${err.message}`);
        });
    }
}
