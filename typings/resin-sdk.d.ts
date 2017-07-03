declare module 'resin-sdk' {
	import * as Promise from 'bluebird';

	function createSdk(): ResinSDK;

	interface ResinSDK {
		auth: {
			loginWithToken(token: string): Promise<void>;
		};
	}

	export = createSdk;
}
