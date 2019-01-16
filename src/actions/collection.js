export const SHOW_CARD = 'SHOW_CARD';
export const UPDATE_COLLECTION = 'UPDATE_COLLECTION';
export const RE_SHOW_CARD = 'RE_SHOW_CARD';

//Collections are a complex conccept. The canonical (slightly out of date) documentation is at https://github.com/jkomoros/complexity-compendium/issues/60#issuecomment-451705854

import {
	scheduleAutoMarkRead
} from './user.js';

import {
	navigatePathTo,
	navigateToCard
} from './app.js';

import {
	DEFAULT_SET_NAME,
	SET_NAMES,
} from '../reducers/collection.js';

import {
	getIdForCard,
	getCard,
	selectDataIsFullyLoaded,
	selectActiveCollection,
	selectActiveSetName,
	selectActiveCardId,
	selectActiveSectionId,
	selectRequestedCard,
	selectActiveFilterNames,
	selectActiveCard,
	selectActiveCardIndex,
	selectPage,
	selectPageExtra,
	getCardIndexForActiveCollection
} from '../selectors.js';

export const FORCE_COLLECTION_URL_PARAM = 'force-collection';

const PLACEHOLDER_CARD_ID_CHARACTER = '_';

export const updateCardSelector = (cardSelector) => (dispatch, getState) => {

	let queryParts = cardSelector.split('?');

	let forceUpdateCollection = false;

	if (queryParts.length > 1) {
		let queryParams = queryParts[1].split('&');
		for (let param of queryParams) {
			if (param == FORCE_COLLECTION_URL_PARAM) forceUpdateCollection = true;
		}
	}

	let path = queryParts[0];

	let parts = path.split('/');

	//Remove trailing slash
	if (!parts[parts.length - 1]) parts.pop();

	//in some weird situations, like during editing commit, we might be at no
	//route even when our view is active. Not entirely clear how, but it
	//happens... for a second.
	let firstPart = parts.length ? parts[0].toLowerCase() : '';
	
	let setName = DEFAULT_SET_NAME;

	for (let name of SET_NAMES) {
		if (name == firstPart) {
			setName = firstPart;
			parts.unshift();
			break;
		}
	}

	let filters = [];

	//Get last part
	let cardIdOrSlug = parts.pop();

	//TODO: detect if it's one of the weird cardIdOrSlugs (e.g. '.', '.default');

	if (parts.length) {
		//If there are still parts, interpret them as filters.

		//TODO: support interpreting them as sorts.
		filters = parts;
	}

	let doUpdateCollection = true;

	if (filters.length == 0) {
		const state = getState();
		let card = getCard(state, cardIdOrSlug);
		if (card) {
			//If we had a default filter URL and the card is a member of the set
			//we're already in, leave the collection information the same.
			if (getCardIndexForActiveCollection(state, card.id) >= 0) {
				doUpdateCollection = false;
			}
			filters = [card.section ? card.section : 'none'];
		} else {
			//Make sure the collection has no items, so canonicalizeURL won't add
			//'all' in it which would then load up the whole collection before
			//redirecting.
			filters = ['none'];
		}
	}

	if (doUpdateCollection || forceUpdateCollection) dispatch(updateCollection(setName, filters));
	dispatch(showCard(cardIdOrSlug));
};

export const updateCollection = (setName, filters) => (dispatch, getState) =>{
	const state = getState();
	let sameSetName = false;
	if (setName == selectActiveSetName(state)) sameSetName = true;

	let sameActiveFilters = false;
	let activeFilters = selectActiveFilterNames(state);
	if (filters.length == activeFilters.length) {
		sameActiveFilters = true;
		for (let i = 0; i < filters.length; i++) {
			if (filters[i] != activeFilters[i]) {
				sameActiveFilters = false;
				break;
			}
		}
	}

	if (sameSetName && sameActiveFilters) return;
	dispatch({
		type: UPDATE_COLLECTION,
		setName,
		filters,
	});
};

export const refreshCardSelector = () => (dispatch, getState) => {
	//Called when cards and sections update, just in case we now have
	//information to do this better. Also called when stars and reads update,
	//because if we're filtering to one of those filters we might not yet know
	//if we're in that collection or not.
	const state = getState();

	let page = selectPage(state);
	if (page != 'c') return;
	let pageExtra = selectPageExtra(state);
	dispatch(updateCardSelector(pageExtra));
};

export const canonicalizeURL = () => (dispatch, getState) => {

	//Called to ensure that the URL is canonical given activeSet, activeFilters, etc.

	let state = getState();

	let card = selectActiveCard(state);

	if (!card) return;

	let activeSectionId = selectActiveSectionId(state);
	let activeFilterNames = selectActiveFilterNames(state);
	let activeSetName = selectActiveSetName(state);

	//TODO: this should be a constant somewhere
	let result = ['c'];

	//Orphaned cards just live at their name and nothing else.
	if (card.section) {

		if (activeSetName != DEFAULT_SET_NAME || activeFilterNames.length == 0) {
			result.push(activeSetName);
		}

		if (!activeSectionId) {
			//activeSectionId is only there if the only filter is the section name the
			//user is in, which can be omitted for brevity.
			result.push(...activeFilterNames);
		}

	}

	result.push(card.name);

	let path = result.join('/');

	//Ensure that the article name that we're shwoing--no matter how they
	//havigated here--is the preferred slug name.
	dispatch(navigatePathTo(path, true));
};

export const redirectIfInvalidCardOrCollection = () => (dispatch, getState) => {

	//This routine is called to make sure that if there is a valid card, we're
	//actually sitting in a collection that contains it. If we aren't, we
	//navigate to its canonical location.

	//It's also responsible for checking to see if the card ID is the special
	//placehodler "_" which means, just pick a random item out of the collection
	//I selected.

	const state = getState();
	if (!selectDataIsFullyLoaded(state)) return;
	let card = selectActiveCard(state);
	let collection = selectActiveCollection(state);
	if (!card) {

		let requestedCard = selectRequestedCard(state);
		//If we're a placeholder card 
		if (requestedCard && requestedCard[0] == PLACEHOLDER_CARD_ID_CHARACTER) {
			if (collection.length) {
				dispatch(navigateToCard(collection[0]), false);
				return;
			}
		}

		//We used to navigate to a default card here, but if the collection we're
		//in is for examples tarred, we miight not be fully loaded yet.

		return;
	}
  
	if (!collection.length) return;
	let index = selectActiveCardIndex(state);
	if (index >= 0) return;
	dispatch(navigateToCard(card, false));
};

export const showCard = (cardIdOrSlug) => (dispatch, getState) => {

	const state = getState();

	let cardId = getIdForCard(state, cardIdOrSlug);

	//If it'll be a no op don't worry about it.
	if (selectActiveCardId(state) == cardId) {
		dispatch(redirectIfInvalidCardOrCollection());
		return;
	}

	dispatch({
		type: SHOW_CARD,
		idOrSlug: cardIdOrSlug,
		card: cardId,
	});
	dispatch(redirectIfInvalidCardOrCollection());
	dispatch(canonicalizeURL());
	dispatch(scheduleAutoMarkRead());
};
