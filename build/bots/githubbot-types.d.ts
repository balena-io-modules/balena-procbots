import { ProcBot } from './procbot';
// GithubBot ------------------------------------------------------------------

// The GithubAction  defines an action, which is passed to a WorkerMethod should all of
// the given pre-requisites be applicable.
// At least one event. For each additional event, this is considered an 'OR' comparator.
// eg. 'pull_request' OR 'pull_request_review' event
// Labels, on the other hand, are ANDed together.
// eg. 'flow/ready-to-merge' AND 'flow/in-review' (trigger or suppression)
//
// In the future, some sort of comparator language might be useful, eg:
// and: [
//  {
//      or: [
//          {
//              name: <eventType>
//              value: 'pull_request',
//              op: eq | neq;
//          },
//          ...
//      }]
//  ,
//  ...
//  }
// ]
export interface GithubAction {
    name: string;
    events: string[];
    triggerLabels?: string[];
    suppressionLabels?: string[];
}

// The Register interface is passed to the GithubBot.register method to register
// for callback when the appropriate events and labels are received.
export interface GithubActionRegister extends GithubAction {
    workerMethod: GithubActionMethod;
}

// A GithubActionMethod is the method that will be used to process an event.
export type GithubActionMethod = <T>(action: GithubAction, data: T) => Promise<void>;
