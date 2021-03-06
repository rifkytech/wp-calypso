/** @format */

/**
 * External dependencies
 */

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { compact, includes, omit, reduce, get, partial } from 'lodash';
import { localize } from 'i18n-calypso';
import Gridicon from 'gridicons';

/**
 * Internal dependencies
 */
import SidebarItem from 'layout/sidebar/item';
import SidebarButton from 'layout/sidebar/button';
import config from 'config';
import { getPostTypes } from 'state/post-types/selectors';
import QueryPostTypes from 'components/data/query-post-types';
import analytics from 'lib/analytics';
import { decodeEntities } from 'lib/formatting';
import compareProps from 'lib/compare-props';
import MediaLibraryUploadButton from 'my-sites/media-library/upload-button';
import {
	getSite,
	getSiteAdminUrl,
	getSiteSlug,
	isJetpackSite,
	isSingleUserSite,
} from 'state/sites/selectors';
import areAllSitesSingleUser from 'state/selectors/are-all-sites-single-user';
import { canCurrentUser as canCurrentUserStateSelector } from 'state/selectors/can-current-user';
import { itemLinkMatches } from './utils';
import { recordTracksEvent } from 'state/analytics/actions';
import { getSelectedEditor } from 'state/selectors/get-selected-editor';
import isCalypsoifyGutenbergEnabled from 'state/selectors/is-calypsoify-gutenberg-enabled';
import { getEditorUrl as getEditorUrlStateSelector } from 'state/selectors/get-editor-url';

class ManageMenu extends PureComponent {
	static propTypes = {
		path: PropTypes.string,
		onNavigate: PropTypes.func,
		siteId: PropTypes.number,
		// connected props
		allSingleSites: PropTypes.bool,
		canCurrentUser: PropTypes.func,
		isJetpack: PropTypes.bool,
		isSingleUser: PropTypes.bool,
		postTypes: PropTypes.object,
		getEditorUrl: PropTypes.func,
		siteAdminUrl: PropTypes.string,
		site: PropTypes.oneOfType( [ PropTypes.object, PropTypes.bool ] ),
		siteSlug: PropTypes.string,
		calypsoifyGutenberg: PropTypes.bool,
	};

	// We default to `/my` posts when appropriate
	getMyParameter() {
		const { allSingleSites, isJetpack, isSingleUser, siteId } = this.props;

		if ( siteId ) {
			return isSingleUser || isJetpack ? '' : '/my';
		}

		// FIXME: If you clear `IndexedDB` and land on a site that has yourself as its only user,
		// and then navigate to multi-site mode, the `areAllSites` predicate will return true,
		// as long as no other sites have been fetched into Redux state. As a consequence, the
		// 'Posts' link will point to `/posts` (instead of `/posts/my` as it should, when you have
		// sites with other users).
		// The fix will be to make sure all sites are fetched into Redux state, see
		// https://github.com/Automattic/wp-calypso/pull/13094
		return allSingleSites ? '' : '/my';
	}

	getDefaultMenuItems() {
		const { calypsoifyGutenberg, getEditorUrl, siteSlug, translate } = this.props;

		return [
			{
				name: 'page',
				label: translate( 'Site Pages' ),
				capability: 'edit_pages',
				queryable: true,
				config: 'manage/pages',
				link: '/pages',
				buttonLink: getEditorUrl( 'page' ),
				forceButtonTargetInternal: calypsoifyGutenberg,
				wpAdminLink: 'edit.php?post_type=page',
				showOnAllMySites: true,
			},
			{
				name: 'post',
				label: translate( 'Blog Posts' ),
				capability: 'edit_posts',
				config: 'manage/posts',
				queryable: true,
				link: '/posts' + this.getMyParameter(),
				paths: [ '/posts', '/posts/my' ],
				buttonLink: getEditorUrl( 'post' ),
				forceButtonTargetInternal: calypsoifyGutenberg,
				wpAdminLink: 'edit.php',
				showOnAllMySites: true,
			},
			{
				name: 'media',
				label: translate( 'Media' ),
				capability: 'upload_files',
				queryable: true,
				link: '/media',
				buttonLink: '/media/' + siteSlug,
				wpAdminLink: 'upload.php',
				showOnAllMySites: false,
			},
			{
				name: 'comments',
				label: translate( 'Comments' ),
				capability: 'edit_posts',
				queryable: true,
				config: 'manage/comments',
				link: '/comments',
				paths: [ '/comment', '/comments' ],
				wpAdminLink: 'edit-comments.php',
				showOnAllMySites: false,
			},
		];
	}

	getPluginItem() {
		const { isAtomicSite, siteSlug, translate } = this.props;
		const buttonLink = siteSlug ? `/plugins/manage/${ siteSlug }` : '/plugins/manage';

		return {
			name: 'plugins',
			label: translate( 'Plugins' ),
			capability: 'manage_options',
			queryable: ! isAtomicSite,
			config: 'manage/plugins',
			link: '/plugins',
			paths: [ '/extensions', '/plugins' ],
			wpAdminLink: 'plugin-install.php?calypsoify=1',
			showOnAllMySites: true,
			buttonLink: ! isAtomicSite ? buttonLink : '',
			buttonText: translate( 'Manage' ),
			extraIcon: isAtomicSite ? 'chevron-right' : null,
			customClassName: isAtomicSite ? 'sidebar__plugins-item' : '',
			forceInternalLink: isAtomicSite,
		};
	}

	getImportItem = () => {
		const { isJetpack, translate } = this.props;

		return {
			name: 'import',
			label: translate( 'Import' ),
			capability: 'manage_options',
			queryable: ! isJetpack,
			config: 'manage/import-in-sidebar',
			link: '/settings/import', // @TODO make it a top level section & add a redirect
			paths: [ '/settings/import' ],
			wpAdminLink: 'import.php',
			showOnAllMySites: false,
			forceInternalLink: ! isJetpack,
		};
	};

	onNavigate = postType => () => {
		if ( ! includes( [ 'post', 'page' ], postType ) ) {
			analytics.mc.bumpStat( 'calypso_publish_menu_click', postType );
		}
		this.props.recordTracksEvent( 'calypso_mysites_manage_sidebar_item_clicked', {
			menu_item: postType,
		} );
		this.props.onNavigate();
	};

	renderMenuItem( menuItem ) {
		const { canCurrentUser, site, siteId, siteAdminUrl } = this.props;

		if ( siteId && ! canCurrentUser( menuItem.capability ) ) {
			return null;
		}

		// Hide the sidebar link for media
		if ( 'attachment' === menuItem.name ) {
			return null;
		}

		// Hide the sidebar link for multiple site view if it's not in calypso, or
		// if it opts not to be shown.
		const isEnabled = ! menuItem.config || config.isEnabled( menuItem.config );
		if ( ! siteId && ( ! isEnabled || ! menuItem.showOnAllMySites ) ) {
			return null;
		}

		let link;
		if ( ( ! isEnabled || ! menuItem.queryable ) && siteAdminUrl ) {
			link = siteAdminUrl + menuItem.wpAdminLink;
		} else {
			link = compact( [ menuItem.link, this.props.siteSlug ] ).join( '/' );
		}

		let preload;
		if ( includes( [ 'post', 'page' ], menuItem.name ) ) {
			preload = 'posts-pages';
		} else if ( 'comments' === menuItem.name ) {
			preload = 'comments';
		} else {
			preload = 'posts-custom';
		}

		let icon;
		switch ( menuItem.name ) {
			case 'post':
				icon = 'posts';
				break;
			case 'page':
				icon = 'pages';
				break;
			case 'import':
				icon = 'cloud-upload';
				break;
			case 'jetpack-portfolio':
				icon = 'folder';
				break;
			case 'jetpack-testimonial':
				icon = 'quote';
				break;
			case 'media':
				icon = 'image';
				break;
			case 'comments':
				icon = 'chat';
				break;
			case 'plugins':
				icon = 'plugins';
				break;
			default:
				icon = 'custom-post-type';
		}

		const extraIcon = menuItem.extraIcon && (
			<div className={ `manage_menu__${ menuItem.name }-extra-icon` }>
				<Gridicon icon={ menuItem.extraIcon } />
			</div>
		);

		return (
			<SidebarItem
				className={ menuItem.customClassName }
				key={ menuItem.name }
				label={ menuItem.label }
				selected={ itemLinkMatches( menuItem.paths || menuItem.link, this.props.path ) }
				link={ link }
				onNavigate={ this.onNavigate( menuItem.name ) }
				icon={ icon }
				preloadSectionName={ preload }
				postType={ menuItem.name === 'plugins' ? null : menuItem.name }
				tipTarget={ `side-menu-${ menuItem.name }` }
				forceInternalLink={ menuItem.forceInternalLink }
			>
				{ menuItem.name === 'media' && (
					<MediaLibraryUploadButton
						className="sidebar__button"
						site={ site }
						href={ menuItem.buttonLink }
						onClick={ this.trackSidebarButtonClick( 'media' ) }
					>
						{ this.props.translate( 'Add' ) }
					</MediaLibraryUploadButton>
				) }
				{ menuItem.name !== 'media' && (
					<SidebarButton
						onClick={ this.trackSidebarButtonClick( menuItem.name ) }
						href={ menuItem.buttonLink }
						preloadSectionName="post-editor"
						forceTargetInternal={ menuItem.forceButtonTargetInternal }
					>
						{ menuItem.buttonText || this.props.translate( 'Add' ) }
					</SidebarButton>
				) }
				{ extraIcon }
			</SidebarItem>
		);
	}

	trackSidebarButtonClick = name => {
		return () => {
			this.props.recordTracksEvent( 'calypso_mysites_manage_sidebar_button_clicked', {
				menu_item: name,
			} );
		};
	};

	getCustomMenuItems() {
		//reusable blocks are not shown in the sidebar on wp-admin either
		const customPostTypes = omit( this.props.postTypes, [ 'post', 'page', 'wp_block' ] );
		return reduce(
			customPostTypes,
			( memo, postType, postTypeSlug ) => {
				// `show_ui` was added in Jetpack 4.5, so explicitly check false
				// value in case site on earlier version where property is omitted
				if ( false === postType.show_ui ) {
					return memo;
				}

				const buttonLink =
					config.isEnabled( 'manage/custom-post-types' ) && postType.api_queryable
						? this.props.getEditorUrl( postTypeSlug )
						: undefined;

				return memo.concat( {
					name: postType.name,
					label: decodeEntities( get( postType.labels, 'menu_name', postType.label ) ),
					config: 'manage/custom-post-types',
					queryable: postType.api_queryable,

					//If the API endpoint doesn't send the .capabilities property (e.g. because the site's Jetpack
					//version isn't up-to-date), silently assume we don't have the capability to edit this CPT.
					capability: get( postType.capabilities, 'edit_posts' ),

					// Required to build the menu item class name. Must be discernible from other
					// items' paths in the same section for item highlighting to work properly.
					link: '/types/' + postType.name,
					wpAdminLink: 'edit.php?post_type=' + postType.name,
					showOnAllMySites: false,
					buttonLink,
					forceButtonTargetInternal: this.props.calypsoifyGutenberg,
				} );
			},
			[]
		);
	}

	render() {
		const menuItems = [ ...this.getDefaultMenuItems(), ...this.getCustomMenuItems() ];

		if ( config.isEnabled( 'calypsoify/plugins' ) ) {
			menuItems.push( this.getPluginItem() );
		}

		if ( config.isEnabled( 'manage/import-in-sidebar' ) ) {
			menuItems.push( this.getImportItem() );
		}

		return (
			<ul>
				{ this.props.siteId && <QueryPostTypes siteId={ this.props.siteId } /> }
				{ menuItems.map( this.renderMenuItem, this ) }
			</ul>
		);
	}
}

export default connect(
	( state, { siteId } ) => ( {
		allSingleSites: areAllSitesSingleUser( state ),
		// eslint-disable-next-line wpcalypso/redux-no-bound-selectors
		canCurrentUser: partial( canCurrentUserStateSelector, state, siteId ),
		isJetpack: isJetpackSite( state, siteId ),
		isSingleUser: isSingleUserSite( state, siteId ),
		postTypes: getPostTypes( state, siteId ),
		// eslint-disable-next-line wpcalypso/redux-no-bound-selectors
		getEditorUrl: partial( getEditorUrlStateSelector, state, siteId, null ),
		siteAdminUrl: getSiteAdminUrl( state, siteId ),
		site: getSite( state, siteId ),
		siteSlug: getSiteSlug( state, siteId ),
		calypsoifyGutenberg:
			isCalypsoifyGutenbergEnabled( state, siteId ) &&
			'gutenberg' === getSelectedEditor( state, siteId ),
	} ),
	{ recordTracksEvent },
	null,
	{ areStatePropsEqual: compareProps( { ignore: [ 'canCurrentUser', 'getEditorUrl' ] } ) }
)( localize( ManageMenu ) );
