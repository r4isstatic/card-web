type TagEventDetail = {
    tag : string,
    subtle : boolean,
};

export type TagEvent = CustomEvent<TagEventDetail>;
export type NewTagEvent = CustomEvent<null>;

export const TAG_TAPPED_EVENT_NAME = 'tag-tapped';
//TODO: change to 'tag-added'
export const TAG_ADDED_EVENT_NAME = 'add-tag';
//TODO: change to 'tag-removed'
export const TAG_REMOVED_EVENT_NAME = 'remove-tag';
//TODO: change to 'tag-new'
export const TAG_NEW_EVENT_NAME = 'new-tag';

export const makeTagTappedEvent = (tagName : string, subtle? : boolean) : TagEvent => {
    return makeTagEvent(TAG_TAPPED_EVENT_NAME, tagName, subtle);
}

export const makeTagAddedEvent = (tagName : string) : TagEvent => {
    return makeTagEvent(TAG_ADDED_EVENT_NAME, tagName);
}

export const makeTagRemovedEvent = (tagName : string) : TagEvent => {
    return makeTagEvent(TAG_REMOVED_EVENT_NAME, tagName);
}

export const makeTagNewEvent = () : NewTagEvent => {
    return new CustomEvent(TAG_NEW_EVENT_NAME, {composed : true, detail: null})
}

const makeTagEvent = (eventName : string, tagName : string, subtle : boolean = false) : TagEvent => {
    return new CustomEvent(eventName, {composed: true, detail: {tag: tagName, subtle}});
}