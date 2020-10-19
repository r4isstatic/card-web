import snarkdown from 'snarkdown';
import dompurify from 'dompurify';
import {
	stemmer
} from './stemmer.js';

import {
	TEXT_FIELD_BODY,
	CARD_TYPE_CONTENT,
	DERIVED_FIELDS_FOR_CARD_TYPE
} from './card_fields.js';

//define this here and then re-export form app.js so this file doesn't need any
//other imports.
export const _PAGE_BASIC_CARD = 'basic-card';

//The properties of the card to search over for queries and their relative
//weight.
export const TEXT_SEARCH_PROPERTIES = {
	normalizedTitle: 1.0,
	normalizedBody: 0.5,
	normalizedSubtitle: 0.75,
	normalizedInboundLinksText: 0.95,
};

export const allSubstrings = (str) => {
	let result = [];

	for (let i = 0; i < str.length; i++) {
		for (let j = i + 1; j < str.length + 1; j++) {
			result.push(str.slice(i, j));
		}
	}
	return result;
};

export const normalizedWords = (str) => {
	if (!str) str = '';

	//Pretend like em-dashes are just spaces
	str = str.split('--').join(' ');
	str = str.split('&emdash;').join(' ');

	const splitWords = str.toLowerCase().split(/\s+/);
	let result = [];
	for (let word of splitWords) {
		word = word.replace(/^\W*/, '');
		word = word.replace(/\W*$/, '');
		if (!word) continue;
		result.push(word);
	}
	return result;
};

let memoizedStemmedWords = {};
const memorizedStemmer = (word) => {
	if (!memoizedStemmedWords[word]) {
		memoizedStemmedWords[word] = stemmer(word);
	}
	
	return memoizedStemmedWords[word];
};

//A more aggressive form of normalization
export const stemmedNormalizedWords = (str) => {
	//Assumes the words are already run through nomralizedWords
	const splitWords = str.split('-').join(' ').split(' ');
	let result = [];
	for (let word of splitWords) {
		result.push(memorizedStemmer(word));
	}
	return result;
};

const fullyNormalizedWords = (str) => {
	let words = normalizedWords(str).join(' ');
	return stemmedNormalizedWords(words);
};

//The max number of words to include in the semantic fingerprint
export const SEMANTIC_FINGERPRINT_SIZE = 25;

const SEMANTIC_FINGERPRINT_MATCH_CONSTANT = 1.0;

//Returns the 'overlap' between two semantic fingerprints (which can be fetched
//from e.g. selectCardsSemanticFingerprint). Higher nubmers are better. The
//numbers may be any number greater than 0, and only have meaning when compared
//to other numbers from this function.
export const semanticOverlap = (fingerprintOne, fingerprintTwo) => {
	if (!fingerprintOne) fingerprintOne = new Map();
	if (!fingerprintTwo) fingerprintTwo = new Map();

	let union = new Set([...fingerprintOne.keys(), ...fingerprintTwo.keys()]);
	let intersection = new Map();
	for (let key of union) {
		if (fingerprintOne.has(key) && fingerprintTwo.has(key)) {
			//If they match, add the tfidf for the two terms, plus a bonus
			//constant for them having matched. This gives a big bonus for any
			//match, but gives a higher score for better matches.
			intersection.set(key, SEMANTIC_FINGERPRINT_MATCH_CONSTANT + fingerprintOne.get(key) + fingerprintTwo.get(key));
		}
	}
	const total = [...intersection.values()].reduce((p, c) => p + c, 0);
	return total;
};

export const hash = (str) => {
	//Adapted from https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
	let hash = 0, i, chr;
	for (i = 0; i < str.length; i++) {
		chr   = str.charCodeAt(i);
		hash  = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};

const randomCharSetNumbers = '0123456789';
const randomCharSetLetters = 'abcdef';
const randomCharSet = randomCharSetNumbers + randomCharSetLetters;

export const randomString = (length, charSet) => {
	if (!charSet) {
		charSet = randomCharSet;
	}
	let text = '';
	for (let i = 0; i < length; i++) {
		text += charSet.charAt(Math.floor(Math.random() * charSet.length));
	}
	return text;
};

//TODO: consider renaming this, because we also use it in selectFullDataNeeded.
export const pageRequiresMainView = (pageName) => {
	return pageName != _PAGE_BASIC_CARD;
};

export const capitalizeFirstLetter = (str) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toTitleCase = (str) => {
	//Based on https://gomakethings.com/converting-a-string-to-title-case-with-vanilla-javascript/
	str = str.toLowerCase().split(' ');
	for (var i = 0; i < str.length; i++) {
		str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
	}
	return str.join(' ');
};

//note: these are recreated in functions/legal.js

const slugRegularExpression = /^[a-zA-Z0-9-_]+$/;

//returns if the given uid looks like it could be legal
export const legalUid = (uid) => {
	if (!slugRegularExpression.test(uid)) return false;
	if (uid.length < 10) return false;
	return true;
};

export const normalizeSlug = (slug) => {
	slug = slug.trim();
	slug = slug.toLowerCase();
	slug = slug.split(' ').join('-');
	slug = slug.split('_').join('-');

	if (!slugRegularExpression.test(slug)) slug = '';

	return slug;
};

export const newID = () => {
	return normalizeSlug('c_' + randomString(3, randomCharSetNumbers) + '_' + randomString(3, randomCharSetLetters) + randomString(3, randomCharSetNumbers));
};

export const urlForTweet = (tweet) => {
	return 'https://twitter.com/' + tweet.user_screen_name + '/status/' + tweet.id;
};

export const cardHasContent = (card) => {
	if (!card) return false;
	//We treat all non-content cards as having content, since the main reason to
	//count a card has not having content is if there's nothing to see on it.
	if (card.card_type != CARD_TYPE_CONTENT) return true;
	let content = card[TEXT_FIELD_BODY] ? card[TEXT_FIELD_BODY].trim() : '';
	return content ? true : false;
};

const SUBSTANTIVE_CONTENT_THRESHOLD = 300;
export const cardHasSubstantiveContent = (card) => {
	if (!card) return false;
	//We treat all non-content cards as having content, since the main reason to
	//count a card has not having content is if there's nothing to see on it.
	if (card.card_type != CARD_TYPE_CONTENT) return true;
	let content = card.normalizedBody ? card.normalizedBody : '';
	return content.length > SUBSTANTIVE_CONTENT_THRESHOLD;
};

//cardSetNormalizedTextProperties sets the properties that search and
//fingerprints work over. It sets them on the same card object sent.
export const cardSetNormalizedTextProperties = (card) => {
	const cardType = card.card_type || '';
	//These three properties are expected to be set by TEXT_SEARCH_PROPERTIES
	//Fields that are derived are calculated based on other fields of the card
	//and should not be considered to be explicit set on the card by the author.
	//For thse fields, skip them in normalized*, since they'll otherwise be part
	//of the fingerprint, and for cards with not much content that use the
	//fingerprint in a derived field that can create reinforcing loops.
	card.normalizedBody = DERIVED_FIELDS_FOR_CARD_TYPE[cardType]['body'] ? '' : fullyNormalizedWords(innerTextForHTML(card.body || '')).join(' ');
	card.normalizedTitle = DERIVED_FIELDS_FOR_CARD_TYPE[cardType]['title'] ? '' : fullyNormalizedWords(card.title).join(' ');
	card.normalizedSubtitle = DERIVED_FIELDS_FOR_CARD_TYPE[cardType]['subtitle'] ? '' : fullyNormalizedWords(card.subtitle).join(' ');
	card.normalizedInboundLinksText = fullyNormalizedWords(Object.values(card.links_inbound_text).join(' ')).join(' ');
};

export const cardHasNotes = (card) => {
	if (!card) return false;
	let content = card.notes ? card.notes.trim() : '';
	return content ? true : false;
};

export const cardHasTodo = (card) => {
	if (!card) return false;
	let content = card.todo ? card.todo.trim() : '';
	return content ? true : false;
};

export const cardBFS = (keyCardIDOrSlug, cards, ply, includeKeyCard, isInbound) => {
	if (!cards[keyCardIDOrSlug]) {
		let foundID = '';
		//The ID isn't in the list of cards. Check to see if maybe it's a slug.
		//getIdForCard requires a state to access slugIndex, so we'll just brute force it.
		for (let card of Object.values(cards)) {
			for (let slug of card.slugs || []) {
				if (slug == keyCardIDOrSlug) {
					foundID = card.id;
					break;
				}
			}
			if (foundID) break;
		}
		keyCardIDOrSlug = foundID;
	}
	let seenCards = {[keyCardIDOrSlug]: 0};
	let cardsToProcess = [keyCardIDOrSlug];

	while (cardsToProcess.length) {
		const id = cardsToProcess.shift();
		const card = cards[id];
		//Must be unpublished
		if (!card) continue;
		const newCardDepth = (seenCards[id] || 0) + 1;
		if (newCardDepth > ply) continue;
		const links = isInbound ? card.links_inbound : card.links;
		for (let linkItem of links) {
			//Skip ones that have already been seen
			if (seenCards[linkItem] !== undefined) continue;
			seenCards[linkItem] = newCardDepth;
			cardsToProcess.push(linkItem);
		}
	}
	if (!includeKeyCard) delete seenCards[keyCardIDOrSlug];
	return Object.fromEntries(Object.entries(seenCards).map(entry => [entry[0], true]));
};

//cardMissingReciprocalLinks returns the links that point to a card that are not
//reciprocated and not explicitly listed as OK to skip.
export const cardMissingReciprocalLinks = (card) => {
	if (!card) return [];
	let links = new Map();
	if (card.links_inbound) {
		for (let link of card.links_inbound) {
			links.set(link, true);
		}
	}
	if (card.links) {
		for (let link of card.links) {
			links.delete(link);
		}
	}
	if (card.auto_todo_skipped_links_inbound) {
		for (let link of card.auto_todo_skipped_links_inbound) {
			links.delete(link);
		}
	}
	return [...links.keys()];
};

//other can be a card ID or a card
export const cardNeedsReciprocalLinkTo = (card, other) => {
	if (typeof other == 'object') other = other.id;
	if (!card || !other) return false;
	const missingReciprocalLinks = cardMissingReciprocalLinks(card);
	for (let link of missingReciprocalLinks) {
		if (link == other) return true;
	}
	return false;
};

//expandCardCollection should be used any time we have a list of IDs of cards and a bundle of cards to expand.
export const expandCardCollection = (collection, cards) => collection.map(id => cards[id] || null).filter(card => card ? true : false);

const innerTextForHTML = (body) => {
	let ele = document.createElement('section');
	//TODO: is there an XSS vulnerability here?
	ele.innerHTML = body;
	return ele.innerText;
};

const MULTIPLE_LINK_TEXT_DELIMITER = ' || ';

export const extractCardLinksFromBody = (body) => {
	let ele = document.createElement('section');
	//TODO: is there an XSS vulnerability here?
	ele.innerHTML = body;
	let result = [];
	let nodes = ele.querySelectorAll('card-link[card]');
	let text = {};
	nodes.forEach(link => {
		const id = link.getAttribute('card');
		result.push(id);
		text[id] = (text[id] ? text[id] + MULTIPLE_LINK_TEXT_DELIMITER : '') + link.innerText;
	});
	return [arrayUnique(result), text];
};

export const arrayRemove = (arr, items) => {
	if (!items) {
		console.warn('arrayRemove called without a second argument, which means you probably wanted arrayRemoveSentinel');
	}
	let itemsToRemove = new Map();
	for (let item of Object.values(items)) {
		itemsToRemove.set(item, true);
	}
	let result = [];
	for (let val of Object.values(arr)) {
		if (itemsToRemove.has(val)) continue;
		result.push(val);
	}
	return result;
};

export const arrayUnion = (arr, items) => {
	if (!items) {
		console.warn('arrayUnion called without a second argument, which means you probably wanted arrayUnionSentinel');
	}
	let result = [];
	let seenItems = new Map();
	for (let val of Object.values(arr)) {
		seenItems.set(val, true);
		result.push(val);
	}
	for (let val of Object.values(items)) {
		if (seenItems.has(val)) continue;
		result.push(val);
	}	
	return result;
};

export const arrayUnique = (arr) => {
	let seenItems = new Map();
	let result = [];
	for (let item of arr) {
		if (seenItems.has(item)) continue;
		result.push(item);
		seenItems.set(item, true);
	}
	return result;
};

export const arrayToSet = (arr) => {
	let result = {};
	for (let item of arr) {
		result[item] = true;
	}
	return result;
};

export const arrayDiffAsSets = (before, after) => {
	let [additions, deletions] = arrayDiff(before,after);
	return [arrayToSet(additions), arrayToSet(deletions)];
};

export const arrayDiff = (before, after) => {
	if (!before) before = [];
	if (!after) after = [];
	let afterMap = new Map();
	for (let item of after) {
		afterMap.set(item, true);
	}
	let deletions = [];
	for (let item of before) {
		if (afterMap.has(item)) {
			//Keep track of that we've seen this one
			afterMap.delete(item);
		} else {
			deletions.push(item);
		}
	}
	//Additions is the keys not remved in afterMap
	let additions = [...afterMap.keys()];
	return [additions, deletions];
};

//triStateMapDiff operates on objects that have keys that are either true or
//false. It returns keys to explicit set to true, keys to explicitly set to
//false, and keys to remove.
export const triStateMapDiff = (before, after) => {
	if (!before) before = {};
	if (!after) after = {};
	//Generat the list of removals by looking for keys that do not exist in
	//after but are in before.
	let removals = [];
	for (let beforeKey of Object.keys(before)) {
		if (after[beforeKey] === undefined) {
			removals.push(beforeKey);
		}
	}

	let enabled = [];
	let disabled = [];
	for (let afterKey of Object.keys(after)) {
		//If before has the after key undefined or false it doesn't matter; in
		//either case it requires an explicit set.
		if(before[afterKey] != after[afterKey]) {
			if (after[afterKey]) {
				enabled.push(afterKey);
			} else {
				disabled.push(afterKey);
			}
		}
	}

	return [enabled, disabled, removals];
};

/*
//Uncomment this block to test tri state.
function testTriStateMapDiff() {
	//TODO: do this in a proper testing framework
	const tests = [
		[
			'No op',
			{a: true, b: false},
			{a: true, b: false},
			[[],[],[]]
		],
		[
			'add c enabled',
			{a: true, b: false},
			{a: true, b: false, c: true},
			[['c'],[],[]],
		],
		[
			'add c disabled',
			{a: true, b: false},
			{a: true, b: false, c: false},
			[[],['c'],[]],
		],
		[
			'remove a',
			{a: true, b: false},
			{b: false},
			[[],[],['a']]
		],
		[
			'disable a',
			{a: true, b: false},
			{a: false, b: false},
			[[],['a'],[]]
		],
		[
			'remove a add c',
			{a: true, b: false},
			{b: false, c: false},
			[[],['c'],['a']]
		],
	];
	for (let test of tests) {
		const description = test[0];
		let [enabled, disabled, deleted] = triStateMapDiff(test[1], test[2]);
		let [goldenEnabled, goldenDisabled, goldenDeleted] = test[3];

		let [enabledAdditions, enabledDeletions] = arrayDiff(goldenEnabled, enabled);
		if (enabledAdditions.length != 0 || enabledDeletions.length != 0) console.warn(description + ' failed enabled didn\'t match: ' + enabled.toString());

		let [disabledAdditions, disabledDeletions] = arrayDiff(goldenDisabled, disabled);
		if (disabledAdditions.length != 0 || disabledDeletions.length != 0) console.warn(description + ' failed disabled didn\'t match: ' + disabled.toString());

		let [deletedAdditions, deletedDeletions] = arrayDiff(goldenDeleted, deleted);
		if (deletedAdditions.length != 0 || deletedDeletions.length != 0) console.warn(description + ' failed deletions didn\'t match: ' + deleted.toString());
	}
	console.log('Tristate tests passed');
}
testTriStateMapDiff();
*/

//items is an array
export const setRemove = (obj, items) => {
	let result = {};
	for (let key of Object.keys(obj)) {
		result[key] = true;
	}
	for (let item of items) {
		delete result[item];
	}
	return result;
};

//items is an array
export const setUnion = (obj, items) => {
	let result = {};
	for (let key of Object.keys(obj)) {
		result[key] = true;
	}
	for (let item of items) {
		result[item] = true;
	}
	return result;
};

export const unionSet = (...sets) => {
	let result = {};
	for (let set of sets) {
		if (!set) continue;
		for (let key of Object.keys(set)) {
			result[key] = true;
		}
	}
	return result;
};

export const intersectionSet = (...sets) => {
	let union = unionSet(...sets);
	let result = {};
	for (let key of Object.keys(union)) {
		//Only include keys that are in every set.
		let doInclude = true;
		for (let set of sets) {
			if (!set) continue;
			if (!set[key]) {
				doInclude = false;
				break;
			}
		}
		if (doInclude) result[key] = true;
	}
	return result;
};

//This logic is finicky and we have a few defaults we want to have, so wrap it
//in a util.
export const makeElementContentEditable = (ele) => {
	ele.contentEditable = 'true';
	//It's OK if we have already done these commands to do them again

	//styleWithCSS turns off styling spans with CSS and just uses presentational
	//attributes. 
	document.execCommand('styleWithCSS', false, false);
	//Browsers currently insert a "<div>" as default paragraph separator but we
	//want 'p'; 
	document.execCommand('defaultParagraphSeparator', false, 'p');
};

//Returns a safe markdown element that can be emitted in a lit-html template.
export const markdownElement = (content) => {
	let div = document.createElement('div');
	let html = snarkdown(content);
	let sanitizedHTML = dompurify.sanitize(html);
	div.innerHTML = sanitizedHTML;
	return div;
};

//Returns a function that takes an item and returns true if it's in ALL
//includeSets and not in any exclude sets.
export const makeCombinedFilter = (includeSets, excludeSets) => {
	return function(item) {
		for (let set of includeSets) {
			if (!set[item]) return false;
		}
		for (let set of excludeSets) {
			if (set[item]) return false;
		}
		return true;
	};
};

//Instead of keeping the filter inverse, this actually expands it into a literal
//filter. allCardsFilter should be the result of selectAllCardsFilter.
//inverseFilter is the concrete filter that you want to be the opposite of.
//Typically inverse filters are represented as the opposite concrete filter and
//never made literal like this, this is most useful for creating
//unionFilterSets. allCardsFilter can also just be the full set of id =>
//fullCard.
export const makeConcreteInverseFilter = (inverseFilter, allCardsFilter) => {
	return Object.fromEntries(Object.entries(allCardsFilter).filter(entry => !inverseFilter[entry[0]]).map(entry => [entry[0], true]));
};

//date may be a firestore timestamp or a date object.
export const prettyTime = (date) => {
	if (!date) return '';
	if (typeof date.toDate == 'function') date = date.toDate();
	return date.toDateString();
};

export const killEvent = (e) => {
	if (e) {
		e.preventDefault();
	}
	return true;
};

export const isWhitespace = (s) => {
	return /^\s*$/.test(s);
};

//Items in the reads and stars collections are stored at a canonical id given
//a uid and card id.
export const idForPersonalCardInfo = (uid, cardId) => {
	return '' + uid + '+' + cardId;
};

let memoizedPageRank = null;
let memoizedPageRankInput = null;

//return a map of id to rank for each card.
export const pageRank = (cards) => {

	if (memoizedPageRankInput === cards) {
		return memoizedPageRank;
	}

	const targetEpsilon = 0.005;
	const jumpProbability = 0.85;
	//since it's not guaranteed to converge, will bail out at this number of
	//iterations.
	const maxIterations = 50;

	const nodes = {};
	const inboundLinksMap = {};
	const numNodes = Object.keys(cards).length;
	const initialRank = 1 / numNodes;

	for (let card of Object.values(cards)) {
		//We can't trust links or inbound_links as they exist, because they
		//might point to unpublished cards, and it's important for the
		//convergence of the algorithm that we have the proper indegree and outdegree. 
		const links = arrayUnique(card.links.filter(id => cards[id]));
		for (let id of links) {
			let list = inboundLinksMap[id];
			if (!list) {
				list = [];
				inboundLinksMap[id] = list;
			}
			list.push(card.id);
		}
		nodes[card.id] = {
			id: card.id,
			rank: initialRank,
			previousRank: initialRank,
			outDegree: links.length,
			//we'll have to updated boht of these in a second pass
			inDegree: 0,
			inboundLinks: [],
		};
	}

	//inboundLinks is now set, so we can set the inDegree.
	for (let id of Object.keys(nodes)) {
		let inboundLinks = inboundLinksMap[id] || [];
		nodes[id].inDegree = inboundLinks.length;
		nodes[id].inboundLinks = inboundLinks;
	}

	//how much the overall graph changed from last time
	let updateDistance = 0;
	let numIterations = 0;

	do {
		numIterations++;
		let totalDistributedRank = 0;
		for (let node of Object.values(nodes)) {
			if (node.inDegree === 0) {
				node.rank = 0.0;
			} else {
				let currentRank = 0.0;
				for (let linkID of node.inboundLinks) {
					let otherNode = nodes[linkID];
					if (!otherNode) continue;
					currentRank += nodes[linkID].previousRank / nodes[linkID].outDegree;
				}
				node.rank = currentRank * jumpProbability;
				totalDistributedRank += node.rank;
			}
		}
		let leakedRankPerNode = (1 - totalDistributedRank) / numNodes;
		updateDistance = 0;
		for (let node of Object.values(nodes)) {
			let currentRank = node.rank + leakedRankPerNode;
			updateDistance += Math.abs(currentRank - node.previousRank);
			node.previousRank = currentRank;
		}
	} while(numIterations < maxIterations && updateDistance > targetEpsilon);

	const result =  Object.fromEntries(Object.entries(nodes).map(entry => [entry[0], entry[1].previousRank]));
	memoizedPageRankInput = cards;
	memoizedPageRank = result;
	return result;
};