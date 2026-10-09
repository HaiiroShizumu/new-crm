import { renderHook } from '@testing-library/react';

import { SmbDealCardBody } from '@/smb-skin/records/components/SmbDealCardBody';
import { useSmbRecordBoardCardBody } from '@/smb-skin/records/hooks/useSmbRecordBoardCardBody';

describe('useSmbRecordBoardCardBody', () => {
  it('returns the dedicated deal body', () => {
    expect(
      renderHook(() => useSmbRecordBoardCardBody('opportunity')).result.current,
    ).toBe(SmbDealCardBody);
  });

  it('returns null for objects without a dedicated body', () => {
    expect(
      renderHook(() => useSmbRecordBoardCardBody('person')).result.current,
    ).toBeNull();
  });
});
