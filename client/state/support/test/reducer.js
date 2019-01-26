/** @format */

/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { isSupportUser, supportSession, SUPPORT_SESSION_STATE } from '../reducer';
import {
	SUPPORT_SESSION_ACTIVATE,
	SUPPORT_SESSION_EXPIRE,
	SUPPORT_USER_ACTIVATE,
} from 'state/action-types';

describe( 'reducer', () => {
	describe( '#isSupportSession', () => {
		test( 'defaults to no session', () => {
			const { NONE } = SUPPORT_SESSION_STATE;

			const state = supportSession( undefined, { type: '@@INIT' } );
			expect( state ).to.equal( NONE );
		} );
		test( 'activated from no session', () => {
			const { NONE, ACTIVE } = SUPPORT_SESSION_STATE;

			const state = supportSession( NONE, { type: SUPPORT_SESSION_ACTIVATE } );
			expect( state ).to.equal( ACTIVE );
		} );
		test( 'expired from active session', () => {
			const { ACTIVE, EXPIRED } = SUPPORT_SESSION_STATE;

			const state = supportSession( ACTIVE, { type: SUPPORT_SESSION_EXPIRE } );
			expect( state ).to.equal( EXPIRED );
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
