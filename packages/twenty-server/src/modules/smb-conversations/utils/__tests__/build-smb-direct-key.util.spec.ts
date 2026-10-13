import { buildSmbDirectKey } from 'src/modules/smb-conversations/utils/build-smb-direct-key.util';

const FIRST_MEMBER_ID = '20202020-0687-4c41-b707-ed1bfca972a7';
const SECOND_MEMBER_ID = '20202020-77d5-4cb6-b60a-f4a835a85d61';

describe('buildSmbDirectKey', () => {
  it('gives the same key whoever opens the conversation', () => {
    expect(buildSmbDirectKey(FIRST_MEMBER_ID, SECOND_MEMBER_ID)).toBe(
      buildSmbDirectKey(SECOND_MEMBER_ID, FIRST_MEMBER_ID),
    );
  });

  it('gives different keys for different pairs', () => {
    expect(buildSmbDirectKey(FIRST_MEMBER_ID, SECOND_MEMBER_ID)).not.toBe(
      buildSmbDirectKey(FIRST_MEMBER_ID, FIRST_MEMBER_ID),
    );
  });
});
