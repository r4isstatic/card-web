import { LitElement, html } from '@polymer/lit-element';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { repeat } from 'lit-html/directives/repeat';

// This element is connected to the Redux store.
import { store } from '../store.js';

import './card-thumbnail.js';

import {
  navigateToCard
} from '../actions/app.js';

import {
  showSection
} from '../actions/data.js';

import { collectionSelector } from '../reducers/data.js'

class CardDrawer extends connect(store)(LitElement) {
  render() {
    return html`
      <style>
        .scrolling {
          overflow:scroll;
          max-height:100%;
          flex-grow:1;
        }
        .container {
          max-height:100%;
          display:flex;
          flex-direction:column;
        }
      </style>
      <div class='container'>
        <div class='controls'>
          <strong>Section</strong>
          <select @change=${this._handleChange}>

            ${repeat(Object.values(this._sections), (item) => item.id, (item, index) => html`
              <option value="${item.id}" ?selected=${item.id == this._activeSectionId}>${item.title}</option>
              `)}
          </select>
        </div>
        <div class='scrolling'>
        ${repeat(this._collection, (i) => i.id, (i, index) => html`
          <card-thumbnail @thumbnail-tapped=${this._thumbnailActivatedHandler} .id=${i.id} .title=${i.title} .selected=${i.id == this._activeCardId}></card-thumbnail>`)}
        </div>
      </div>
    `;
  }

  _thumbnailActivatedHandler(e) {
    store.dispatch(navigateToCard(e.target.id));
  }

  _handleChange(e) {
    let ele = e.path[0];
    store.dispatch(showSection(ele.value));
  }

  static get properties() { return {
    _collection: { type: Array },
    _activeCardId: { type: String },
    _activeSectionId: { type: String },
    _sections: { type: Object }

  }}

  // This is called every time something is updated in the store.
  stateChanged(state) {
    this._collection = collectionSelector(state);
    this._activeCardId = state.data.activeCardId;
    this._activeSectionId = state.data.activeSectionId;
    this._sections = state.data.sections;
  }
}

window.customElements.define('card-drawer', CardDrawer);
