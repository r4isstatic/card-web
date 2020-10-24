import {
	CARD_TYPE_WORKING_NOTES
} from './card_fields.js';

import {
	getSemanticFingerprintForCard
} from './selectors.js';

import {
	cardSetNormalizedTextProperties
} from './util.js';

const WORKING_NOTES_TITLE_PREFIX = '>';
const NUM_TERMS_OF_FINGERPRINT = 8;

const workingNotesExtractor = (card,state) => {
	//TODO: also include first part of semantic fingerprint.
	const date = card.updated.toDate();
	const cardCopy = {...card};
	//The fingerprint requires these to be up to date, but we only update these
	//on a timeout in textFieldUpdated so typing isn't expensive. It's possible
	//that timeout hasn't fired yet, so make sure the card content is up to date.
	cardSetNormalizedTextProperties(cardCopy);
	const fingerprint = getSemanticFingerprintForCard(state, cardCopy);
	const prettyFingerprint = fingerprint ? [...fingerprint.keys()].slice(0, NUM_TERMS_OF_FINGERPRINT).join(' ') : '';
	const title = WORKING_NOTES_TITLE_PREFIX + ' ' + date.toLocaleDateString('en-US', {month:'numeric', day:'numeric', year:'2-digit'}) + ' ' + prettyFingerprint;
	return {
		...card,
		title,
	};
};

//These are the functions that should be passed a card right as editing is
//committing. They are given the card and the state, and should return a card
//with the fields set as they want. The card should not be modified; if new
//fields are to be added a copy should be returned. This is a useful point to do
//field derivation, like title fields for working-notes cards. 
export const CARD_TYPE_EDITING_FINISHERS = {
	[CARD_TYPE_WORKING_NOTES]: workingNotesExtractor,
};