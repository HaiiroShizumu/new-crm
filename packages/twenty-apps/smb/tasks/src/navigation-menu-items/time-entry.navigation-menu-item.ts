import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  TIME_ENTRY_NAV_ITEM_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: TIME_ENTRY_NAV_ITEM_UNIVERSAL_IDENTIFIER,
  position: 1,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
});
