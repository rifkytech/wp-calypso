/** @format */

/**
 * Internal dependencies
 */

import { SUPPORT_USER_ACTIVATE, SUPPORT_SESSION_TRANSITION } from 'state/action-types';
import { SESSION_ACTIVE, SESSION_EXPIRED } from './reducer';

export function supportUserActivate() {
	return {
		type: SUPPORT_USER_ACTIVATE,
	};
}

export function supportSessionActivate() {
	return {
		type: SUPPORT_SESSION_TRANSITION,
		nextState: SESSION_ACTIVE,
	};
}

export function supportSessionExpire() {
	return {
		type: SUPPORT_SESSION_TRANSITION,
		nextState: SESSION_EXPIRED,
	};
}
