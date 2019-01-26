/**
 * Internal dependencies
 */
import { SUPPORT_SESSION_STATE } from './reducer';

export function isSupportSession( state ) {
	const { supportSession } = state.support;
	return (
		supportSession === SUPPORT_SESSION_STATE.ACTIVE ||
		supportSession === SUPPORT_SESSION_STATE.EXPIRED
	);
}
