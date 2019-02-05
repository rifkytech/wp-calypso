/** @format */
/**
 * External dependencies
 */
import { stringify } from 'qs';
import superagent from 'superagent';
import debugFactory from 'debug';
import crypto from 'crypto';

/**
 * Internal dependencies
 */
import { filterUserObject } from 'lib/user/shared-utils';
import { getActiveTestNames } from 'lib/abtest/utility';
import config from 'config';
import { setSupportSession } from '../support-session';

const debug = debugFactory( 'calypso:bootstrap' ),
	API_KEY = config( 'wpcom_calypso_rest_api_key' ),
	AUTH_COOKIE_NAME = 'wordpress_logged_in',
	/**
	 * WordPress.com REST API /me endpoint.
	 */
	SUPPORT_SESSION_API_KEY = config( 'wpcom_calypso_support_session_rest_api_key' ),
	API_PATH = 'https://public-api.wordpress.com/rest/v1/me',
	apiQuery = {
		meta: 'flags',
		abtests: getActiveTestNames( { appendDatestamp: true, asCSV: true } ),
	},
	url = `${ API_PATH }?${ stringify( apiQuery ) }`;

/**
 * Requests the current user for user bootstrap.
 *
 * @param {(string|undefined)} authCookieValue The authentication cookie, if there is one.
 * @param {string}             geoCountry      The GeoIP country code.
 * @param {(string|undefined)} supportSession  The support session.
 *
 * @returns {Promise<object>} A promise for a user object.
 */
module.exports = function( authCookieValue, geoCountry, supportSession ) {
	return new Promise( ( resolve, reject ) => {
		if ( authCookieValue && supportSession ) {
			reject(
				new Error(
					'Both an auth cookie and a support session were provided for bootstrap. This should not occur.'
				)
			);
			return;
		}
		if ( ! authCookieValue && ! supportSession ) {
			reject( new Error( 'Cannot bootstrap without an auth cookie or a support session.' ) );
			return;
		}

		// create HTTP Request object
		const req = superagent.get( url );

		if ( authCookieValue ) {
			authCookieValue = decodeURIComponent( authCookieValue );

			if ( typeof API_KEY !== 'string' ) {
				return reject(
					new Error( 'Unable to boostrap user because of invalid API key in secrets.json' )
				);
			}

			const hmac = crypto.createHmac( 'md5', API_KEY );
			hmac.update( authCookieValue );
			const hash = hmac.digest( 'hex' );

			req.set( 'X-Forwarded-GeoIP-Country-Code', geoCountry );
			req.set( 'Authorization', 'X-WPCALYPSO ' + hash );
			req.set( 'Cookie', AUTH_COOKIE_NAME + '=' + authCookieValue );
			req.set( 'User-Agent', 'WordPress.com Calypso' );
		} else if ( supportSession ) {
			const hmac = crypto.createHmac( 'md5', SUPPORT_SESSION_API_KEY );
			hmac.update( supportSession );
			const hash = hmac.digest( 'hex' );
			req.set( 'Authorization', `X-WPCALYPSO-SUPPORT-SESSION ${ hash }` );

			setSupportSession( req, supportSession );
		}

		// start the request
		req.end( function( err, res ) {
			let error, key;

			if ( err && ! res ) {
				return reject( err );
			}

			const body = res.body;
			const statusCode = res.status;

			debug( '%o -> %o status code', url, statusCode );

			if ( err ) {
				error = new Error();
				error.statusCode = statusCode;
				for ( key in body ) {
					error[ key ] = body[ key ];
				}

				return reject( error );
			}

			const user = filterUserObject( body );

			resolve( user );
		} );
	} );
};
