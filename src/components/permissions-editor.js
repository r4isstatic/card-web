
import { LitElement, html } from '@polymer/lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';

// This element is connected to the Redux store.
import { store } from '../store.js';

import {
	selectAllPermissions,
	selectAuthors
} from '../selectors.js';

import {
	EDIT_ICON
} from './my-icons.js';

import {
	updateUserNote
} from '../actions/permissions.js';

import {
	PERMISSIONS_INFO
} from '../permissions.js';

import './tag-list.js';

const All_PERMISSIONS = Object.fromEntries(Object.entries(PERMISSIONS_INFO).map(entry => [entry[0], {...entry[1], id: entry[0], title:entry[1].displayName}]));
const MODIFIABLE_PERMISSIONS = Object.fromEntries(Object.entries(All_PERMISSIONS).filter(entry => !entry[1].locked));

class PermissionsEditor extends connect(store)(LitElement) {
	render() {
		return html`
			<style>
				.container {
					color: var(--app-dark-text-color-subtle);
				}

				.editable {
					color: var(--app-dark-text-color);
				}

				.edit {
					cursor: pointer;
				}

				svg {
					height:1.3em;
					width:1.3em;
					fill: var(--app-dark-text-color-subtle);
				}

				svg:hover {
					fill: var(--app-dark-text-color);
				}
			</style>
			<div class="container ${this._editable ? 'editable' : ''}">
				<h4>${this._title}</h4>
				${this.description ? html`<p>${this.description}</p>` : ''}
				<pre>
					${JSON.stringify(this._effectivePermissions, null, 2)}
				</pre>
				${this._editable ? html`
					${this._effectivePermissions.admin ? html`<p><strong>Admin</strong> (Remove via firebase console)</p>` : ''}
					<tag-list .tags=${this._enabledModifiablePermissions} .tagInfos=${MODIFIABLE_PERMISSIONS} .overrideTypeName=${'Permission'}></tag-list>
					<strong>Notes</strong> ${this._effectivePermissions.notes} <span class='edit' @click=${this._handleEditNotes}>${EDIT_ICON}</span>` : '' }
			</div>
			`;
	}

	static get properties() {
		return {
			//If provided, will use this
			permissions: { type: Object },
			//If provided, will title it this
			title: { type: String },
			description: { type: String},
			//If provided, will show the permissions for the given user
			uid: { type: String },
			_allPermissions: { type: Object },
			_authors: { type: Object },
		};
	}

	get _editable() {
		return !this.permissions;
	}

	get _title() {
		if (this.title) return this.title;
		const authorInfo = this._authors[this.uid];
		if (authorInfo) {
			return authorInfo.displayName + ' (' + this.uid + ')';
		}
		return this.uid || 'Generic Permissions';
	}

	get _effectivePermissions() {
		return this.permissions || this._allPermissions[this.uid];
	}

	get _enabledModifiablePermissions() {
		return Object.keys(this._effectivePermissions).filter(item => MODIFIABLE_PERMISSIONS[item]);
	}

	stateChanged(state) {
		this._allPermissions = selectAllPermissions(state);
		this._authors = selectAuthors(state);
	}

	_handleEditNotes() {
		const notes = prompt('What should notes be?', this._effectivePermissions.notes);
		store.dispatch(updateUserNote(this.uid, notes));
	}
}

window.customElements.define('permissions-editor', PermissionsEditor);
