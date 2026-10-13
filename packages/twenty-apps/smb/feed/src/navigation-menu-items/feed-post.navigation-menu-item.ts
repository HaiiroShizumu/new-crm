import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  FEED_POST_OBJECT_UNIVERSAL_IDENTIFIER,
  FEED_POST_NAV_ITEM_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: FEED_POST_NAV_ITEM_UNIVERSAL_IDENTIFIER,
  position: 0,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: FEED_POST_OBJECT_UNIVERSAL_IDENTIFIER,
});
