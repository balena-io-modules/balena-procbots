import {
    ServiceEmitContext,
} from './service-types';

export interface DiscourseMessageEmitContext extends ServiceEmitContext {
    raw: string;
    api_username: string;
    api_token: string;
    whisper: 'true' | 'false';
    topic_id?: string;
}

export interface DiscoursePost {
    cooked: string;
    [key: string]: string;
}
