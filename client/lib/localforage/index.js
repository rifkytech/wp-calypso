/** @format */

/**
 * External dependencies
 */

import localforage from 'localforage';
import { reduce } from 'lodash';
import debug from 'debug';

/**
 * Internal dependencies
 */
import localforageBypass from './localforage-bypass';
import isSupportSession from 'lib/support-session';

/**
 * Module variables
 */
const log = debug( 'calypso:localforage' );

const config = {
	name: 'calypso',
	storeName: 'calypso_store',
	version: 1.0,
	description: 'Calypso Browser Storage',
	driver: [ localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE ],
};

let _ready = false;
const applyBypass = () => {
	if ( _ready ) {
		log( 'Cannot bypass localforage after initialization' );
	} else {
		config.driver = [ localforageBypass._driver ];
	}
};

// Promise that resolves when our localforage configuration has been applied
const localForagePromise = localforage
	.defineDriver( localforageBypass )
	.then( () => {
		// Handle this here rather than during app boot because we do not control
		// when this promise-fulfilled callback is called. At the time this comment
		// was written, this callback was being run prior to app boot,
		// at which time it is too late to apply the localforage bypass.
		if ( isSupportSession() ) {
			applyBypass();
		}

		localforage.config( config );
		_ready = true;
		return localforage;
	} )
	.catch( error => log( 'Configuring localforage: %s', error ) );

// Wraps a function to run after waiting until a promise has resolved.
// The promise should contain the original object for context.
const wrapOriginalFunc = ( promise, original ) => {
	return function( ...args ) {
		return promise.then( context => original.apply( context, args ) );
	};
};

// List of localforage methods that should wait for localForagePromise to resolve
const wrapFuncs = [
	'getItem',
	'setItem',
	'removeItem',
	'length',
	'key',
	'keys',
	'iterate',
	'clear',
];

// Proxy each localforage method to ensure our configuration is initialized first
// NOTE: This means every localForage method returns a promise
const localForageProxy = reduce(
	wrapFuncs,
	( result, fn ) => {
		result[ fn ] = wrapOriginalFunc( localForagePromise, localforage[ fn ] );
		return result;
	},
	{}
);

localForageProxy.bypass = applyBypass;

export default Object.assign( {}, localforage, localForageProxy );
