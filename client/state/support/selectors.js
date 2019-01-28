/**
 * Internal dependencies
 */
import { SESSION_ACTIVE, SESSION_EXPIRED } from './reducer';

export function isSupportSession( { support: { supportSession: state } } ) {
	return state === SESSION_ACTIVE || state === SESSION_EXPIRED;
}
