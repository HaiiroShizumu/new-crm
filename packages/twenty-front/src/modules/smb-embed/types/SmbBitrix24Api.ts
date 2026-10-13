// The part of the BX24 JavaScript library this application uses.
// https://apidocs.bitrix24.ru/sdk/bx24-js-sdk/index.html
export type SmbBitrix24Api = {
  init: (callback: () => void) => void;
  openApplication: (
    parameters?: Record<string, unknown>,
    onClose?: () => void,
  ) => void;
  closeApplication: () => void;
};
