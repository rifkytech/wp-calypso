/** @format */

/**
 * External dependencies
 */
import debugFactory from 'debug';

/**
 * Internal dependencies
 */
import { combineReducers } from 'state/utils';
import {
	SUPPORT_SESSION_TRANSITION,
	SUPPORT_USER_ACTIVATE,
	SERIALIZE,
	DESERIALIZE,
} from 'state/action-types';

const debug = debugFactory( 'calypso:state:support:actions' );

export const SESSION_NONE = 'none';
export const SESSION_ACTIVE = 'active';
export const SESSION_EXPIRED = 'expired';

export const SUPPORT_SESSION_STATE = {
	NONE: 'none',
	ACTIVE: 'active',
	EXPIRED: 'expired',
};

function supportSession( state = SESSION_NONE, { type, nextState } ) {
	switch ( type ) {
		case SUPPORT_SESSION_TRANSITION:
			if (
				( state === SESSION_NONE && nextState === SESSION_ACTIVE ) ||
				( state === SESSION_ACTIVE && nextState === SESSION_EXPIRED )
			) {
				return nextState;
			}

			debug( `invalid support session transition from '${ state }' to '${ nextState }'` );
			return state;

		// Support custom persistence so the client is willing to consume this state from the server.
		// We don't actually want to persist this state, so serialize to null.
		// TODO: Consider way to relay non-persisted state from the server and remove this hack.
		case SERIALIZE:
			return null;
		case DESERIALIZE:
			return state === null ? SESSION_NONE : state;

		default:
			return state;
	}
}
supportSession.hasCustomPersistence = true;

export { supportSession };

export function isSupportUser( state = false, { type } ) {
	switch ( type ) {
		case SUPPORT_USER_ACTIVATE:
			return true;
	}

	return state;
}

export default combineReducers( {
	supportSession,
	isSupportUser,
} );
