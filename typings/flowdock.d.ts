interface FlowdockStream {
	on(event: string, callback: (response: any) => void): void;
}

type FlowdockCallbackMethod = (error: Error, body: any, result: any) => void;

type FlowdockRequestMethod = (path: string, data: object, callback: FlowdockCallbackMethod) => void;

declare module 'flowdock' {
	class Session {
		public get: FlowdockRequestMethod;
		public post: FlowdockRequestMethod;
		public put: FlowdockRequestMethod;
		constructor(token: string);
		public flows(callback: (error: Error, body: any, result: any) => void): void;
		public stream(ids: string[]): FlowdockStream;
		public on(event: string, callback: (error: Error) => void): void;
		public removeListener(event: string, callback: (error: Error) => void): void;
	}
}
