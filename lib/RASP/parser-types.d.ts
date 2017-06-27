import { GithubConstructor, GithubListenerConstructor } from '../services/github-types';

export const enum ClassType {
    ServiceListener,
    ServiceEmitter,
    ListenerMethod,
    UserDefined,
}

export interface ClassVariable {
    name: string;
    type: ClassType;
}

export const enum ServiceType {
    Listener = 0,
    Emitter = 1,
}

export interface ServiceDefinition {
    type: ServiceType;
    name: string;
    serviceName?: string;
    constructDetails?: any;
}

export interface BotDetails {
    // Overall details.
    botName?: string;
    classVariables?: any[]; // The private variables that need setting. Such as assigned service variables
    listeners?: ServiceDefinition[];
    emitters?: ServiceDefinition[];
    registrations?: any[];
    listenerMethods?: any[];

    // Current details
    currentService?: ServiceDefinition;
    currentRegistration?: any;
}
