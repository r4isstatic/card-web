/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import {
  UPDATE_PAGE,
  UPDATE_OFFLINE,
  OPEN_SNACKBAR,
  CLOSE_SNACKBAR,
  OPEN_COMMENTS_PANEL,
  CLOSE_COMMENTS_PANEL
} from '../actions/app.js';

const INITIAL_STATE = {
  location: '',
  page: '',
  pageExtra: '',
  offline: false,
  snackbarOpened: false,
  commentsPanelOpen: true,
  cardInfoPanelOpen: false
};

const app = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case UPDATE_PAGE:
      return {
        ...state,
        location: action.location,
        page: action.page,
        pageExtra: action.pageExtra
      };
    case UPDATE_OFFLINE:
      return {
        ...state,
        offline: action.offline
      };
    case OPEN_SNACKBAR:
      return {
        ...state,
        snackbarOpened: true
      };
    case CLOSE_SNACKBAR:
      return {
        ...state,
        snackbarOpened: false
      };
    case OPEN_COMMENTS_PANEL:
      return {
        ...state,
        commentsPanelOpen: true
      }
    case CLOSE_COMMENTS_PANEL:
      return {
        ...state,
        commentsPanelOpen: false
      }
    default:
      return state;
  }
};

export default app;
