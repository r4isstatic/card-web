import { html } from '@polymer/lit-element';
import { PageViewElement } from './page-view-element.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { repeat } from 'lit-html/directives/repeat';

// This element is connected to the Redux store.
import { store } from '../store.js';

// We are lazy loading its reducer.
import maintenance from '../reducers/maintenance.js';
store.addReducers({
	maintenance,
});

import { 
	selectUserIsAdmin,
	selectMaintenanceModeEnabled,
	selectExecutedMaintenanceTasks,
	selectNextMaintenanceTaskName
} from '../selectors.js';

import {
	connectLiveExecutedMaintenanceTasks,
	MAINTENANCE_TASKS,
} from '../actions/maintenance.js';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';
//We include a hidden card-stage because it provides teh sizingCardRenderer so
//the maintence task update-font-size-boost can work
import './card-stage.js';

class MaintenanceView extends connect(store)(PageViewElement) {
	render() {
		return html`
	  ${SharedStyles}
	  <style>
	  	.primary {
			  text-align:center;
			  font-size: 2.0em;
		  }

		  h4, h5 {
			  margin: 0;
		  }

		  h5 {
			  color: var(--app-dark-text-color-light);
		  }

	  </style>
      <section>
        <h2>Maintenance</h2>
        <p>This page is where maintenance can be done.</p>
        <section ?hidden=${this._isAdmin}>
          <p>You aren't an admin, so nothing is available here.</p>
        </section>
        <section ?hidden=${!this._isAdmin}>
          <p>You're an admin!</p>
		  <div class='primary'>
			<h2>Next task to run: </h2>
			${this._buttonForTaskName(this._nextTaskName)}
			<p ?hidden=${!this._nextTaskConfig.maintenanceModeRequired}>You must enable maintenance mode to run this task by running 'gulp turn-maintenance-mode-on'</p>
		  </div>
		  <br />
		  <br />
		  <br />
		  <h4>Recurring tasks</h4>
		  <h5>disabled ones need maintenance mode to be enabled via 'gulp turn-maintenance-mode-on'</h5>
		  ${repeat(Object.entries(MAINTENANCE_TASKS).filter(entry => entry[1].recurring).map(entry => entry[0]), (item) => item, (item) => this._buttonForTaskName(item))}
		  <p>Tasks that have already been run: ${[...Object.keys(this._executedTasks)].join(', ')}</p>
        </section>
		<card-stage style='visibility:hidden;z-index:-100;position:absolute'></card-stage>
      </section>
    `;
	}

	_buttonForTaskName(taskName) {
		if (!taskName) return html`<em>No tasks to run</em>`;
		const config = MAINTENANCE_TASKS[taskName] || {};
		let disabled = false;
		if (config.maintenanceModeRequired && !this._maintenanceModeEnabled) disabled = true;
		if (!config.recurring && this._executedTasks[taskName]) disabled = true;
		const displayName = config.displayName || taskName;
		return html`<button value=${taskName} @click=${this._handleClick} .disabled=${disabled}>${displayName}</button>`;
	}

	static get properties() {
		return {
			_isAdmin: { type: Boolean},
			_maintenanceModeEnabled: { type: Boolean},
			_executedTasks: { type:Object},
			_nextTaskName: { type:String},
		};
	}

	get _nextTaskConfig() {
		if (!this._executedTasks) return {};
		return this._executedTasks[this._nextTaskName] || {};
	}

	connectedCallback() {
		super.connectedCallback();
		connectLiveExecutedMaintenanceTasks();
	}

	stateChanged(state) {
		this._isAdmin = selectUserIsAdmin(state);
		this._maintenanceModeEnabled = selectMaintenanceModeEnabled(state);
		this._executedTasks = selectExecutedMaintenanceTasks(state);
		this._nextTaskName = selectNextMaintenanceTaskName(state);
	}

	_runTask(taskName) {
		const taskConfig = MAINTENANCE_TASKS[taskName];
		if (!taskConfig) throw new Error('No such task');
		store.dispatch(taskConfig.actionCreator());
	}

	_handleClick(e) {
		let ele = e.composedPath()[0];
		this._runTask(ele.value);
	}

}

window.customElements.define('maintenance-view', MaintenanceView);
