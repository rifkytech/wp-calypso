/**
 * Internal dependencies
 */
import { isSupportSession as isSupportSessionSelector } from 'state/support/selectors';

export function isSupportSession() {
	// Use server-provided redux state because this needs to answer before we have a redux store.
	// Otherwise, localforage is already initialized and will not accept being bypassed.
	return isSupportSessionSelector( window.initialReduxState );
}

// TODO: Add listener for session expiration.
