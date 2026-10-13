import { pickSmbViewTabs } from '@/smb-shell/view-bar/utils/pickSmbViewTabs';

const views = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }));

describe('pickSmbViewTabs', () => {
  it('returns every view when they fit', () => {
    expect(pickSmbViewTabs({ views: views.slice(0, 2), maxCount: 4 })).toEqual([
      { id: 'a' },
      { id: 'b' },
    ]);
  });

  it('keeps the leading views when the current one is among them', () => {
    expect(pickSmbViewTabs({ views, currentViewId: 'b', maxCount: 3 })).toEqual(
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    );
  });

  it('gives the last tab to a current view that sits past the cut', () => {
    expect(pickSmbViewTabs({ views, currentViewId: 'e', maxCount: 3 })).toEqual(
      [{ id: 'a' }, { id: 'b' }, { id: 'e' }],
    );
  });

  it('ignores a current view id that is not in the list', () => {
    expect(
      pickSmbViewTabs({ views, currentViewId: 'zzz', maxCount: 2 }),
    ).toEqual([{ id: 'a' }, { id: 'b' }]);
  });
});
