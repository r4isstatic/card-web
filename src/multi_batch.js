//The limit that Firebase enacts for writes in one batch. MultiBatch will count
//writes correctly, including double-counting updates that use one of the
//readback sentinels.
const FIRESTORE_BATCH_LIMIT = 500;

//We import these only to get deleteSentinel without importing from firebase.js.
import firebase from '@firebase/app';
import '@firebase/firestore';
const serverTimestampSentinel = firebase.firestore.FieldValue.serverTimestamp;

const extraOperationCountForValue = (val) => {
	//Note: this function is very tied to the implementation of
	//firestore.FieldValue and may need to change if it changes.
	if (typeof val !== 'object') return false;
	//TODO: also recurse into normal objects if not a sentinel
	if (!val['lc']) return false;
	if (typeof val['lc'] !== 'string') return false;
	const parts = val['lc'].split('.');
	if (parts.length !== 2) return false;
	if (parts[0] !== 'FieldValue') return false;
	if (parts[1] !== 'serverTimestamp' && parts[1] !== 'arrayRemove' && parts[1] != 'arrayUnion') return false;
	return true;
};

const SENTINEL_DEFINITION_VALID = extraOperationCountForValue(serverTimestampSentinel());

if (!SENTINEL_DEFINITION_VALID) {
	console.warn('The shape of sentinel values that Multibatch is designed to look for seems to be out of date. That means batch sizes will be smaller than they need to be.');
}

//If we can't detect sentinels correctly, we need to assume that EVERY update double-counts.
const EFFECTIVE_BATCH_LIMIT = SENTINEL_DEFINITION_VALID ? FIRESTORE_BATCH_LIMIT : Math.floor(FIRESTORE_BATCH_LIMIT / 2) - 1;

//MultiBatch is a thing that can be used as a drop-in replacement firebase db
//batch, and will automatically split into multiple underlying batches if it's
//getting close to the limit. Note that unlike a normal batch, it's possible for
//a partial failure if one batch fails and others don't.
export const MultiBatch = class {
	constructor(db) {
		this._db = db;
		this._currentBatchOperationCount = 0;
		this._currentBatch = null;
		this._batches = [];
	}

	get _batch() {
		if (this._currentBatchOperationCount >= EFFECTIVE_BATCH_LIMIT) {
			this._currentBatch = null;
		}
		if (!this._currentBatch) {
			this._currentBatch = this._db.batch();
			this._batches.push(this._currentBatch);
			this._currentBatchOperationCount = 0;
		}
		return this._currentBatch;
	}

	_writeCountForUpdate(update) {
		//Firestore treats updates as counting for 1, unless there are 1 or more
		//of {serverTimestamp, arrayUnion, or arrayRemove}.
		
		for (let val of Object.values(update)) {
			if (extraOperationCountForValue(val)) return 2;
		}
		return 1;
	}

	delete(ref) {
		this._batch.delete(ref);
		this._currentBatchOperationCount++;
		return this;
	}

	set(ref, data, options) {
		this._batch.set(ref, data, options);
		this._currentBatchOperationCount += this._writeCountForUpdate(data);
		return this;
	}

	update(ref, data) {
		//TODO: the signature in the documentation is kind of weird for this
		//one. Are there two different modes?
		this._batch.update(ref, data);
		this._currentBatchOperationCount += this._writeCountForUpdate(data);
		return this;
	}

	commit() {
		return Promise.all(this._batches.map(batch => batch.commit()));
	}

};