/*eslint-env node*/

import {
	JSDOM
} from 'jsdom';

import {
	overrideDocument
} from '../../src/document.js';

const dom = new JSDOM('');

overrideDocument(dom.window.document);

import {
	cardSetNormalizedTextProperties,
	FingerprintGenerator
} from '../../src/nlp.js';

import {
	CARD_TYPE_CONTENT,
	CARD_TYPE_WORKING_NOTES,
	REFERENCE_TYPE_LINK,
	REFERENCE_TYPE_ACK,
	REFERENCE_TYPE_DUPE_OF,
} from '../../src/card_fields.js';

import assert from 'assert';

const CARD_ID_ONE = 'one';
const CARD_ID_TWO = 'two';
const CARD_ID_THREE = 'three';
const CARD_ID_FOUR = 'four';
const CARD_ID_FIVE = 'five';

const baseCards = (extras) => {
	if (!extras) extras = {};
	const cards = {
		...extras,
		...{
			[CARD_ID_ONE]: {
				'body': '<p>This is the body of this card.</p>\n<p>Seed crystals crystalize gradients <card-link card=\'two\'>surfing down</card-link> <strong>them</strong> a lot. Complexity is a key concept to understand and uncertainty.</p>',
				'title': 'This is the title of this card',
			},
			[CARD_ID_TWO]: {
				//Note: this one does not include newlines after block elements
				//Note: this is the content of card g487aed6370_0_25 from production
				'body': '<p>The <card-link href="https://en.wikipedia.org/wiki/Cynefin_framework">Cynefin model</card-link> divides problems into four types, each with different properties.</p><ul><li><strong>Simple</strong> - Trivial problem spaces that require no special effort.</li><li><strong>Complicated</strong> - Knowably hard. Intricate and challenging, but concrete and black and white. Efficiency will require a focus on the right process and structure.</li><li><strong>Complex</strong> - <em>Unknowably</em> hard. Goals, methods, and even possible next actions are unclear, meaning <card-link card="g487aed6370_0_61">fundamentally different approaches are required</card-link>.</li><li><strong>Chaotic</strong> - So unknowably hard as to be inscrutable--impossible to control or predict. <card-link card="g487aed6370_0_30">Beware diagnosing problems as chaotic</card-link> because it’s effectively giving up.</li></ul><p>Distinguishing between <card-link card="g487aed6370_0_45">complex and complicated</card-link> is the most important in practice.</p><p class="small"><em>Note on terminology: in the past I called what Cynefin calls “complex” “ambiguous”, and what it calls “complicated”, “complex”.  I’ve shifted to use Cynfefin’s terminology consistently.</em></p',
				'title': 'Using the cynefin model to understand problem spaces',
				'references_info_inbound': {
					'card_1': {
						[REFERENCE_TYPE_LINK]: 'cynefin model\ncynefin\'s model',
					},
					'card_2': {
						[REFERENCE_TYPE_ACK]: '',
					},
					'card_3': {
						[REFERENCE_TYPE_DUPE_OF]: 'cynenfin model dupe',
					}
				}
			},
			[CARD_ID_THREE]: {
				'body': '<p>Gradients are important and you should pay attention to them! They\'re an important type of complexity.</p><p><card-link card="g487aed6370_0_55">Humans are biased away from complex problem spaces.</card-link> But correctly diagnosing a problem space as complex is only the first step.</p><p>In complex problem spaces, you <strong>have to let go of the </strong><strong><card-link card="g487aed6370_0_76">details that don’t matter</card-link></strong>, because they’re <card-link card="g487aed6370_0_71">a dangerous illusion</card-link>. Doing this is hard, unnatural, and a little scary. But it’s the only way to see broader truths.</p><p>You have to l<strong>et go of ever having solutions that are </strong><strong><em>both</em></strong><strong> detailed and clear.</strong> You can have one but not the other (and generally only the latter). When you let go, you can become <strong>cosmically calm</strong>, and high-level truths will become evident.</p><p>Certain types of solutions are fundamentally impossible in complexity, although people who are uncomfortable with complexity will continue to demand them.</p>',
				'title': 'Embracing complexity means letting go of details',
			},
			[CARD_ID_FOUR]: {
				'card_type': CARD_TYPE_WORKING_NOTES,
				'body': '<p>Hill climbing is totally a thing.</p><p>There is not one truth</p><p>(just as there is not one cause, or one solution)</p><p>Truth is a mindset, a process. Seeking disconfirming evidence, incorporating it into an ever-more nuanced model. Ground-truthing even when it\'s inconvenient.</p><p>(Make sure to make it not "any truth is as good as any other" post modernism). Things can be more or less true, it\'s that there\'s a <em>spectrum</em>.</p><p>Truth is an asymptotic ideal, what matters is motion towards the goal, not ever landing at it. And if you think you\'ve landed at it, and thus no longer have more growth to do, you\'re wrong... and dangerous, because you\'ve stopped learning</p><p>Learning as the process of truth discovery.</p><p>Truth as being a partially situated context. What is true for you in your personal development in the moment might not be true for you later.</p><p>The more it exists outside and generally and directly affects others, the more that it\'s ground-truthed and not subjective.</p>',
				//This title should be skipped since it's a working notes card
				'title': '11/4/20 Truth Landing Ground True You\'ve Ever Incorporating Process',
			},
			[CARD_ID_FIVE]: {
				'body': '<p>https://www.wikipedia.org/blammo is a great site. It\'s important to think of stuff (e.g. other stuff).</p><p>hill-climbing is the same as hill climbing. This is not--not really--the same. This is a quote: "a quote is here". Boundaries/edges are imporant to think about</p><p>Anothe site to know about is komoroske.com/sudoku, or even washingtonpost.com</p>',
				'title': 'This card has lots of interesting details',
			},
		}
	};

	for (let card of Object.values(cards)) {
		if (!card.card_type) card.card_type = CARD_TYPE_CONTENT;
		cardSetNormalizedTextProperties(card);
	}

	return cards;
};

describe('fingerprint generation', () => {
	it('Normalized properties', async () => {
		const cards = baseCards();
		const expectedNormalized = {
			[CARD_ID_ONE]: {
				'body': 'thi is the bodi of thi card seed crystal crystal gradient surf down them a lot complex is a kei concept to understand and uncertainti',
				'title': 'thi is the titl of thi card',
				'subtitle': '',
				'references_info_inbound': '',
			},
			[CARD_ID_TWO]: {
				'body': 'the cynefin model divid problem into four type each with differ properti simpl trivial problem space that requir no special effort complic knowabl hard intric and challeng but concret and black and white effici will requir a focu on the right process and structur complex unknow hard goal method and even possibl next action ar unclear mean fundament differ approach ar requir chaotic so unknow hard as to be inscrut imposs to control or predict bewar diagnos problem as chaotic becaus it’ effect give up distinguish between complex and complic is the most import in practic note on terminolog in the past i call what cynefin call complex ambigu and what it call complic complex i’v shift to us cynfefin’ terminolog consist',
				'title': 'us the cynefin model to understand problem space',
				'subtitle': '',
				'references_info_inbound': 'cynefin model cynefin\' model cynenfin model dupe',
			},
			[CARD_ID_THREE]: {
				'body': 'gradient ar import and you should pai attent to them they\'r an import type of complex human ar bias awai from complex problem space but correctli diagnos a problem space as complex is onli the first step in complex problem space you have to let go of the detail that don’t matter becaus they’r a danger illus do thi is hard unnatur and a littl scari but it’ the onli wai to see broader truth you have to let go of ever have solut that ar both detail and clear you can have on but not the other and gener onli the latter when you let go you can becom cosmic calm and high level truth will becom evid certain type of solut ar fundament imposs in complex although peopl who ar uncomfort with complex will continu to demand them',
				'title': 'embrac complex mean let go of detail',
				'subtitle': '',
				'references_info_inbound': '',
			},
			[CARD_ID_FOUR]: {
				'body': 'hill climb is total a thing there is not on truth just as there is not on caus or on solut truth is a mindset a process seek disconfirm evid incorpor it into an ever more nuanc model ground truth even when it\' inconveni make sure to make it not ani truth is as good as ani other post modern thing can be more or less true it\' that there\' a spectrum truth is an asymptot ideal what matter is motion toward the goal not ever land at it and if you think you\'v land at it and thu no longer have more growth to do you\'r wrong and danger becaus you\'v stop learn learn as the process of truth discoveri truth as be a partial situat context what is true for you in your person develop in the moment might not be true for you later the more it exist outsid and gener and directli affect other the more that it\' ground truth and not subject',
				'title': '',
				'subtitle': '',
				'references_info_inbound': '',
			},
			[CARD_ID_FIVE]: {
				'body': 'https://www.wikipedia.org/blammo is a great site it\' import to think of stuff e.g other stuff hill climb is the same as hill climb thi is not not realli the same thi is a quot a quot is here boundaries/edg ar impor to think about anoth site to know about is komoroske.com/sudoku or even washingtonpost.com',
				'title': 'thi card ha lot of interest detail',
				'subtitle': '',
				'references_info_inbound': '',
			},
		};
		for (let [cardID, card] of Object.entries(cards)) {
			let normalized = expectedNormalized[cardID];
			assert.deepStrictEqual(card.normalized, normalized);
		}
	});

	it('fingerprints', async () => {
		const cards = baseCards();
		const generator = new FingerprintGenerator(cards);
		const expectFingerprints = {
			[CARD_ID_ONE]: new Map([
				[ 'crystal', 0.013865546851022273 ],
				[ 'titl', 0.012435625271001175 ],
				[ 'bodi', 0.012435625271001175 ],
				[ 'seed', 0.012435625271001175 ],
				[ 'surf', 0.012435625271001175 ],
				[ 'down', 0.012435625271001175 ],
				[ 'kei', 0.012435625271001175 ],
				[ 'concept', 0.012435625271001175 ],
				[ 'uncertainti', 0.012435625271001175 ],
				[ 'gradient', 0.0069327734255111365 ],
				[ 'lot', 0.0069327734255111365 ],
				[ 'understand', 0.0069327734255111365 ],
				[ 'card', 0.006056875813003526 ],
				[ 'them', 0.003028437906501763 ],
				[ 'complex', -0.012967917124088062 ],
				[ 'to', -0.015785936822497064 ],
				[ 'and', -0.018814374728998825 ],
				[ 'of', -0.021401417551387893 ],
				[ 'a', -0.029820078419978906 ],
				[ 'thi', -0.03190906313791325 ],
				[ 'the', -0.03762874945799765 ],
				[ 'is', -0.05842962097480317 ]
			]),
			[CARD_ID_TWO]: new Map([
				[ 'us', 0.0032386678776110418 ],
				[ 'differ', 0.0032386678776110418 ],
				[ 'unknow', 0.0032386678776110418 ],
				[ 'chaotic', 0.0032386678776110418 ],
				[ 'terminolog', 0.0032386678776110418 ],
				[ 'divid', 0.0029046715961462597 ],
				[ 'four', 0.0029046715961462597 ],
				[ 'each', 0.0029046715961462597 ],
				[ 'properti', 0.0029046715961462597 ],
				[ 'simpl', 0.0029046715961462597 ],
				[ 'trivial', 0.0029046715961462597 ],
				[ 'special', 0.0029046715961462597 ],
				[ 'effort', 0.0029046715961462597 ],
				[ 'knowabl', 0.0029046715961462597 ],
				[ 'intric', 0.0029046715961462597 ],
				[ 'challeng', 0.0029046715961462597 ],
				[ 'concret', 0.0029046715961462597 ],
				[ 'black', 0.0029046715961462597 ],
				[ 'white', 0.0029046715961462597 ],
				[ 'effici', 0.0029046715961462597 ],
				[ 'focu', 0.0029046715961462597 ],
				[ 'right', 0.0029046715961462597 ],
				[ 'structur', 0.0029046715961462597 ],
				[ 'method', 0.0029046715961462597 ],
				[ 'possibl', 0.0029046715961462597 ]
			]),
			[CARD_ID_THREE]: new Map([
				[ 'becom', 0.003018350334916413 ],
				[ 'embrac', 0.0027070748889254257 ],
				[ 'should', 0.0027070748889254257 ],
				[ 'pai', 0.0027070748889254257 ],
				[ 'attent', 0.0027070748889254257 ],
				[ 'they\'r', 0.0027070748889254257 ],
				[ 'human', 0.0027070748889254257 ],
				[ 'bias', 0.0027070748889254257 ],
				[ 'awai', 0.0027070748889254257 ],
				[ 'from', 0.0027070748889254257 ],
				[ 'correctli', 0.0027070748889254257 ],
				[ 'first', 0.0027070748889254257 ],
				[ 'step', 0.0027070748889254257 ],
				[ 'don’t', 0.0027070748889254257 ],
				[ 'they’r', 0.0027070748889254257 ],
				[ 'illus', 0.0027070748889254257 ],
				[ 'unnatur', 0.0027070748889254257 ],
				[ 'littl', 0.0027070748889254257 ],
				[ 'scari', 0.0027070748889254257 ],
				[ 'wai', 0.0027070748889254257 ],
				[ 'see', 0.0027070748889254257 ],
				[ 'broader', 0.0027070748889254257 ],
				[ 'both', 0.0027070748889254257 ],
				[ 'clear', 0.0027070748889254257 ],
				[ 'latter', 0.0027070748889254257 ]
			]),
			[CARD_ID_FOUR]: new Map([
				[ 'thing', 0.0026568712528904958 ],
				[ 'there', 0.0026568712528904958 ],
				[ 'ground', 0.0026568712528904958 ],
				[ 'make', 0.0026568712528904958 ],
				[ 'ani', 0.0026568712528904958 ],
				[ 'land', 0.0026568712528904958 ],
				[ 'at', 0.0026568712528904958 ],
				[ 'you\'v', 0.0026568712528904958 ],
				[ 'learn', 0.0026568712528904958 ],
				[ 'for', 0.0026568712528904958 ],
				[ 'total', 0.002382874303425375 ],
				[ 'just', 0.002382874303425375 ],
				[ 'caus', 0.002382874303425375 ],
				[ 'mindset', 0.002382874303425375 ],
				[ 'seek', 0.002382874303425375 ],
				[ 'disconfirm', 0.002382874303425375 ],
				[ 'incorpor', 0.002382874303425375 ],
				[ 'nuanc', 0.002382874303425375 ],
				[ 'inconveni', 0.002382874303425375 ],
				[ 'sure', 0.002382874303425375 ],
				[ 'good', 0.002382874303425375 ],
				[ 'post', 0.002382874303425375 ],
				[ 'modern', 0.002382874303425375 ],
				[ 'less', 0.002382874303425375 ],
				[ 'there\'', 0.002382874303425375 ]
			]),
			[CARD_ID_FIVE]: new Map([
				[ 'site', 0.007394958320545212 ],
				[ 'stuff', 0.007394958320545212 ],
				[ 'same', 0.007394958320545212 ],
				[ 'quot', 0.007394958320545212 ],
				[ 'about', 0.007394958320545212 ],
				[ 'ha', 0.006632333477867293 ],
				[ 'interest', 0.006632333477867293 ],
				[ 'https://www.wikipedia.org/blammo', 0.006632333477867293 ],
				[ 'great', 0.006632333477867293 ],
				[ 'e.g', 0.006632333477867293 ],
				[ 'realli', 0.006632333477867293 ],
				[ 'here', 0.006632333477867293 ],
				[ 'boundaries/edg', 0.006632333477867293 ],
				[ 'impor', 0.006632333477867293 ],
				[ 'anoth', 0.006632333477867293 ],
				[ 'know', 0.006632333477867293 ],
				[ 'komoroske.com/sudoku', 0.006632333477867293 ],
				[ 'washingtonpost.com', 0.006632333477867293 ],
				[ 'lot', 0.003697479160272606 ],
				[ 'think', 0.003230333766935214 ],
				[ 'hill', 0.003230333766935214 ],
				[ 'climb', 0.003230333766935214 ],
				[ 'card', 0.001615166883467607 ],
				[ 'even', 0.001615166883467607 ],
				[ 'detail', 0 ]
			])
		};
		for (let cardID of Object.keys(cards)) {
			let expectedFingerprint = expectFingerprints[cardID];
			let fingerprint = generator.fingerprintForCardID(cardID);
			assert.deepStrictEqual(fingerprint, expectedFingerprint);
		}
	});

});