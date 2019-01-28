/** @format */

/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import {
	isSupportUser,
	supportSession,
	SESSION_NONE,
	SESSION_ACTIVE,
	SESSION_EXPIRED,
} from '../reducer';
import { SUPPORT_SESSION_TRANSITION, SUPPORT_USER_ACTIVATE } from 'state/action-types';

describe( 'reducer', () => {
	describe( '#isSupportSession', () => {
		test( 'defaults to no session', () => {
			const state = supportSession( undefined, { type: '@@INIT' } );
			expect( state ).to.equal( SESSION_NONE );
		} );
		test( 'activated from no session', () => {
			const state = supportSession( SESSION_NONE, {
				type: SUPPORT_SESSION_TRANSITION,
				nextState: SESSION_ACTIVE,
			} );
			expect( state ).to.equal( SESSION_ACTIVE );
		} );
		test( 'expired from active session', () => {
			const state = supportSession( SESSION_ACTIVE, {
				type: SUPPORT_SESSION_TRANSITION,
				nextState: SESSION_EXPIRED,
			} );
			expect( state ).to.equal( SESSION_EXPIRED );
		} );
	} );

	describe( '#isSupportUser()', () => {
		test( 'should set to true after activate', () => {
			const state = isSupportUser( false, {
				type: SUPPORT_USER_ACTIVATE,
			} );

			expect( state ).to.equal( true );
		} );
	} );
} );
