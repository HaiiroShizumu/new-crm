import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  DEPARTMENTS_NAV_ITEM_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: DEPARTMENTS_NAV_ITEM_UNIVERSAL_IDENTIFIER,
  position: 0,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
});
