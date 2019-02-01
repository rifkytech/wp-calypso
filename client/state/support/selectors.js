/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { SESSION_ACTIVE, SESSION_EXPIRED } from './reducer';

export function isSupportSession( state ) {
	// Use lodash get to support querying server-provided state which may not include a `support` key.
	const sessionState = get( state, [ 'support', 'supportSession' ] );
	return sessionState === SESSION_ACTIVE || sessionState === SESSION_EXPIRED;
}
