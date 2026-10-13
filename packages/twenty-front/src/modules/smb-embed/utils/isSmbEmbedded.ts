// True when the application runs inside another site's frame, which for this
// product means the Bitrix24 portal. Reading window.top of a foreign origin
// may throw, and that also means "embedded".
export const isSmbEmbedded = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};
