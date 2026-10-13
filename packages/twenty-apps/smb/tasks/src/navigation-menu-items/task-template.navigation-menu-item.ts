import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TASK_TEMPLATE_OBJECT_UNIVERSAL_IDENTIFIER,
  TASK_TEMPLATE_NAV_ITEM_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: TASK_TEMPLATE_NAV_ITEM_UNIVERSAL_IDENTIFIER,
  position: 0,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: TASK_TEMPLATE_OBJECT_UNIVERSAL_IDENTIFIER,
});
