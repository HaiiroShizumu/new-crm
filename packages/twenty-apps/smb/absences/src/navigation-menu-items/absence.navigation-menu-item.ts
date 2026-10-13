import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ABSENCE_OBJECT_UNIVERSAL_IDENTIFIER,
  ABSENCE_NAV_ITEM_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: ABSENCE_NAV_ITEM_UNIVERSAL_IDENTIFIER,
  position: 0,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: ABSENCE_OBJECT_UNIVERSAL_IDENTIFIER,
});
