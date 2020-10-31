import { html } from '@polymer/lit-element';
import { PageViewElement } from './page-view-element.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { repeat } from 'lit-html/directives/repeat';

// This element is connected to the Redux store.
import { store } from '../store.js';

import { 
	selectUserIsAdmin,
	selectMaintenanceModeEnabled
} from '../selectors.js';

import {
	doInitialSetUp,
	tasks,
	maintenceModeRequiredTasks
} from '../actions/maintenance.js';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';

class MaintenanceView extends connect(store)(PageViewElement) {
	render() {
		return html`
      ${SharedStyles}
      <section>
        <h2>Maintenance</h2>
        <p>This page is where maintenance can be done.</p>
        <section ?hidden=${this._isAdmin}>
          <p>You aren't an admin, so nothing is available here.</p>
        </section>
        <section ?hidden=${!this._isAdmin}>
          <p>You're an admin!</p>
		  <button @click='${this._handleInitialSetUp}'>Initial SetUp</button>
		  <br />
		  <br />
		  <br />
          ${repeat(Object.keys(tasks), (item) => item, (item) => html`
              <button value="${item}" @click='${this._handleClick}'>${item}</button>
		  `)}
		  <br />
		  <h5>Tasks that require maintence mode to be enabled via 'gulp turn-maintenance-mode-on'</h5>
		  ${repeat(Object.keys(maintenceModeRequiredTasks), (item) => item, (item) => html`
              <button value="${item}" @click='${this._handleClick}' .disabled=${!this._maintenanceModeEnabled}>${item}</button>
          `)}
        </section>
      </section>
    `;
	}

	static get properties() {
		return {
			_isAdmin: { type: Boolean},
			_maintenanceModeEnabled: { type: Boolean},
		};
	}

	stateChanged(state) {
		this._isAdmin = selectUserIsAdmin(state);
		this._maintenanceModeEnabled = selectMaintenanceModeEnabled(state);
	}

	_handleInitialSetUp() {
		store.dispatch(doInitialSetUp());
	}

	_handleClick(e) {
		let ele = e.composedPath()[0];
		let value = ele.value;
		let func = tasks[value] || maintenceModeRequiredTasks[value];
		if (!func) {
			console.log('That func isn\'t defined');
			return;
		}
		func();
	}

}

window.customElements.define('maintenance-view', MaintenanceView);
