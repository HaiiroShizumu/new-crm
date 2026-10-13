// react-virtuoso keeps the scroll position while older items are prepended only
// if the first index shrinks by exactly the number of items added. seq is
// contiguous, so "offset + seq of the oldest loaded message" does that for free.
export const SMB_CONVERSATION_VIRTUAL_LIST_INDEX_OFFSET = 1_000_000;
