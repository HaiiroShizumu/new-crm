import {
  fromPersonalWorkspaceNavItems,
  toPersonalWorkspaceNavItems,
} from '@/smb-ui-preferences/utils/personalWorkspaceNavItemMappers';
import {
  NavigationMenuItemType as GeneratedNav,
  type NavigationMenuItem,
} from '~/generated-metadata/graphql';

const navigationMenuItem = (type: GeneratedNav): NavigationMenuItem => ({
  __typename: 'NavigationMenuItem',
  id: '66222222-0000-0000-0000-000000000001',
  type,
  position: 1,
  name: 'Клиенты',
  createdAt: '2026-10-12T00:00:00.000Z',
  updatedAt: '2026-10-12T00:00:00.000Z',
});

describe('personalWorkspaceNavItemMappers', () => {
  it('converts a generated NavigationMenuItem into a personal nav item', () => {
    const [item] = toPersonalWorkspaceNavItems([
      navigationMenuItem(GeneratedNav.VIEW),
    ]);

    expect(item).toEqual({
      id: '66222222-0000-0000-0000-000000000001',
      type: 'VIEW',
      position: 1,
      folderId: undefined,
      targetObjectMetadataId: undefined,
      targetRecordId: undefined,
      viewId: undefined,
      pageLayoutId: undefined,
      name: 'Клиенты',
      link: undefined,
      icon: undefined,
      color: undefined,
    });
  });

  it('round-trips personal nav items back to the generated type', () => {
    const source = [navigationMenuItem(GeneratedNav.FOLDER)];
    const [personal] = toPersonalWorkspaceNavItems(source);
    const [back] = fromPersonalWorkspaceNavItems([personal]);

    expect(back.id).toBe(source[0].id);
    expect(back.type).toBe(source[0].type);
    expect(back.position).toBe(source[0].position);
    expect(back.name).toBe(source[0].name);
    expect(back.createdAt).toBe('1970-01-01T00:00:00.000Z');
  });
});
