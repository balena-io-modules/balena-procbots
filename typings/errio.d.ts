/*
 * Copyright (C) Balena.io - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 * Proprietary and confidential.
 */

// Type definitions for errio
declare module 'errio' {
	let toObject: (
		error: Error,
		options: {
			stack: boolean;
		},
	) => object;

	let fromObject: (data: any) => Error;

	let stringify: (
		error: Error,
		options: {
			stack: boolean;
		},
	) => string;
}
