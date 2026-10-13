import { ApiPath } from 'twenty-shared/types';

// Under an existing API prefix on purpose: the server answers every other GET
// that accepts HTML with the front document, and a new ApiPath value would be
// one more core patch.
export const SMB_BITRIX_ROUTE_PREFIX = `${ApiPath.Webhooks}/smb-bitrix`;
