/**
 * Answers whether an inbound Express request looks like a support session
 *
 * @param {object} request Express request
 *
 * @returns {Boolean} Whether the request looks like a support session
 */
export function isSupportSession( request ) {
	return !! getSupportSession( request );
}

/**
 * Gets the support session nonce from an incoming Express request
 *
 * @param {object} request Express request
 *
 * @returns {?string} The support session nonce for a request, if any.
 */
export function getSupportSession( request ) {
	return request.get( 'x-support-session' );
}

/**
 * Sets the support session nonce for an outbound superagent request
 *
 * @param {object} request Superagent request
 * @param {string} supportSession The support session nonce
 */
export function setSupportSession( request, supportSession ) {
	request.set( 'x-support-session', supportSession );
}
