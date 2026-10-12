import { MainNavigationDrawerNavigationContent } from '@/smb-shell/navigation/components/MainNavigationDrawerNavigationContent';
import { NavigationDrawerTabbedContent } from '@/smb-shell/navigation/components/NavigationDrawerTabbedContent';
import { NavigationDrawerScrollableContent } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerScrollableContent';

// U-2 (перенос v2.42.6 -> v2.45.6): ветки режимов Messenger и Document
// management убраны — в базе v2.45.6 этих режимов больше нет, а разделы
// будущих модулей приходят в меню из реестра (smb-modules), не из условий
// в коде. Состав контента верхнего уровня: вкладки (CRM / AI chat).
export const MainNavigationDrawerContent = () => (
  <NavigationDrawerScrollableContent>
    <NavigationDrawerTabbedContent
      showAiChatContent={false}
      shouldMountAiChatContent={false}
      navigationContent={<MainNavigationDrawerNavigationContent />}
    />
  </NavigationDrawerScrollableContent>
);
