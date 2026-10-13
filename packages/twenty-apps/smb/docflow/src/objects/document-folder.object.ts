import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  DOCUMENT_FOLDER_COLOR_UNIVERSAL_IDENTIFIER,
  DOCUMENT_FOLDER_NAME_UNIVERSAL_IDENTIFIER,
  DOCUMENT_FOLDER_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineObject({
  universalIdentifier: DOCUMENT_FOLDER_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'smbDocumentFolder',
  namePlural: 'smbDocumentFolders',
  labelSingular: 'Папка документов',
  labelPlural: 'Папки документов',
  description: 'Папка в дереве документов компании',
  icon: 'IconFolder',
  labelIdentifierFieldMetadataUniversalIdentifier:
    DOCUMENT_FOLDER_NAME_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: DOCUMENT_FOLDER_NAME_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      label: 'Название',
      icon: 'IconAbc',
      name: 'name',
    },
    {
      universalIdentifier: DOCUMENT_FOLDER_COLOR_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      label: 'Цвет',
      icon: 'IconPalette',
      name: 'color',
      defaultValue: "'GRAY'",
      options: [
        {
          id: 'cc211c98-25aa-4152-bf3a-683a94802991',
          value: 'GRAY',
          label: 'Серый',
          position: 0,
          color: 'gray',
        },
        {
          id: '24d4e509-a5dd-4919-acaf-63b9eca5991b',
          value: 'BLUE',
          label: 'Синий',
          position: 1,
          color: 'blue',
        },
        {
          id: 'e1a9b896-ded0-4153-ae31-275539e0f914',
          value: 'GREEN',
          label: 'Зелёный',
          position: 2,
          color: 'green',
        },
        {
          id: '6932e1d5-8ad4-4a87-bb1e-b2f4f9a5bb37',
          value: 'ORANGE',
          label: 'Оранжевый',
          position: 3,
          color: 'orange',
        },
        {
          id: '220fc4db-37fd-47ce-9754-133a6a7e3eeb',
          value: 'RED',
          label: 'Красный',
          position: 4,
          color: 'red',
        },
        {
          id: '2516ec8c-9e1d-4eeb-993f-1791c908e35b',
          value: 'PURPLE',
          label: 'Фиолетовый',
          position: 5,
          color: 'purple',
        },
      ],
    },
  ],
});
