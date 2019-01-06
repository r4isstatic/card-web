import { LitElement, html } from '@polymer/lit-element';

import {BaseCard} from './base-card.js';

import './card-link.js';

import {
  normalizeBodyToContentEditable,
  normalizeBodyHTML,
  reportSelectionRange
} from '../actions/editor.js';

let loadingTemplate = html`<span class='loading'>Loading...<span>`
let blankTemplate = html`<span class='loading'>Content goes here...</span>`
let invalidCardTemplate = html`No card by that name, try a link from above`;

// This element is *not* connected to the Redux store.
export class ContentCard extends BaseCard {
  innerRender() {
    return html`
      <h1>${this.title ? this.title : (this.fullBleed ? '' : this._emptyTemplate)}</h1>
      ${this._makeSection(this.body)}
    `;
  }

  static get properties() {
    return {
      title: { type: String },
      body: { type: String },
      id: {type: String},
      fullBleed: {type: String},
      fromContentEditable: {type:Boolean},
      dataIsFullyLoaded: {type:Boolean},
      _sectionElement: {type:Object}
    }
  }

  _bodyChanged(e) {
    this.dispatchEvent(new CustomEvent('body-updated', {composed:true, detail: {html: this._sectionElement.innerHTML}}));
  }

  _selectionChanged(e) {
    let selection = this.shadowRoot.getSelection();
    if (!selection.focusNode) return;
    reportSelectionRange(selection.getRangeAt(0));
  }

  get _emptyTemplate() {
    if (this.id) return blankTemplate;
    return  this.dataIsFullyLoaded ? invalidCardTemplate: loadingTemplate;
  }

  firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    document.addEventListener('selectionchange', this._selectionChanged.bind(this));
  }

  _makeSection(body) {
    //If the update to body came from contentEditable then don't change it,
    //the state is already in it. If we were to update it, the selection state
    //would reset and defocus.
    if (this.fromContentEditable && this._sectionElement) {
      return this._sectionElement;
    }
    if (!body) {
      return this._emptyTemplate;
    }
    const section = document.createElement("section");
    this._sectionElement = section;
    body = normalizeBodyHTML(body);
    if (this.editing) {
      section.contentEditable = "true";
      section.addEventListener('input', this._bodyChanged.bind(this));
      body = normalizeBodyToContentEditable(body);
    }
    section.innerHTML = body;
    if(this.fullBleed) section.className = "full-bleed";
    return section;
  }
}

window.customElements.define('content-card', ContentCard);
