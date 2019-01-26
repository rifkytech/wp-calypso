/** @format */

/**
 * Internal dependencies
 */

import {
	SUPPORT_USER_ACTIVATE,
	SUPPORT_SESSION_ACTIVATE,
	SUPPORT_SESSION_EXPIRE,
} from 'state/action-types';

export function supportUserActivate() {
	return {
		type: SUPPORT_USER_ACTIVATE,
	};
}

export function supportSessionActivate() {
	return {
		type: SUPPORT_SESSION_ACTIVATE,
	};
}

export function supportSessionExpire() {
	return {
		type: SUPPORT_SESSION_EXPIRE,
	};
}
