import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  DOCUMENT_EDITOR_KIND_UNIVERSAL_IDENTIFIER,
  DOCUMENT_EDITOR_SNAPSHOT_UNIVERSAL_IDENTIFIER,
  DOCUMENT_FILE_UNIVERSAL_IDENTIFIER,
  DOCUMENT_NAME_UNIVERSAL_IDENTIFIER,
  DOCUMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  DOCUMENT_STATUS_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineObject({
  universalIdentifier: DOCUMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'smbDocument',
  namePlural: 'smbDocuments',
  labelSingular: 'Документ',
  labelPlural: 'Документы',
  description: 'Документ компании: файл, статус, ответственный',
  icon: 'IconFiles',
  labelIdentifierFieldMetadataUniversalIdentifier:
    DOCUMENT_NAME_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: DOCUMENT_NAME_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      label: 'Название',
      icon: 'IconAbc',
      name: 'name',
    },
    {
      universalIdentifier: DOCUMENT_FILE_UNIVERSAL_IDENTIFIER,
      type: FieldType.FILES,
      label: 'Файл',
      icon: 'IconPaperclip',
      name: 'file',
      universalSettings: { maxNumberOfValues: 1 },
    },
    {
      universalIdentifier: DOCUMENT_STATUS_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      label: 'Статус',
      icon: 'IconProgressCheck',
      name: 'status',
      defaultValue: "'DRAFT'",
      options: [
        {
          id: 'a0e18a38-4cd3-417d-afb8-30ae5568adaf',
          value: 'DRAFT',
          label: 'Черновик',
          position: 0,
          color: 'gray',
        },
        {
          id: '173d34b6-a325-4fe8-bf89-f3635efaf941',
          value: 'IN_REVIEW',
          label: 'На согласовании',
          position: 1,
          color: 'orange',
        },
        {
          id: 'fe0a1f41-895c-4137-85c6-0315f9a375c6',
          value: 'APPROVED',
          label: 'Согласован',
          position: 2,
          color: 'green',
        },
        {
          id: 'beb9ae41-787e-4dd8-82f6-2442f4a46209',
          value: 'ARCHIVED',
          label: 'В архиве',
          position: 3,
          color: 'blue',
        },
      ],
    },
    // Какой редактор открывает документ (ADR-016 п.8). Пока все значения
    // показывает один просмотрщик файла, Univer добавится записью в реестр фронта.
    {
      universalIdentifier: DOCUMENT_EDITOR_KIND_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      label: 'Редактор',
      icon: 'IconEdit',
      name: 'editorKind',
      defaultValue: "'NONE'",
      options: [
        {
          id: '04188e00-de3f-4d7f-bfc9-a38703898f80',
          value: 'NONE',
          label: 'Файл',
          position: 0,
          color: 'gray',
        },
        {
          id: '7120c842-3d38-4560-b434-7cdf48b5b799',
          value: 'UNIVER_SHEET',
          label: 'Таблица',
          position: 1,
          color: 'green',
        },
        {
          id: 'ac29b1e1-b344-4b15-8701-27d537744ea4',
          value: 'UNIVER_DOC',
          label: 'Текст',
          position: 2,
          color: 'blue',
        },
      ],
    },
    {
      universalIdentifier: DOCUMENT_EDITOR_SNAPSHOT_UNIVERSAL_IDENTIFIER,
      type: FieldType.RAW_JSON,
      label: 'Снимок редактора',
      icon: 'IconBraces',
      name: 'editorSnapshot',
      isNullable: true,
      defaultValue: null,
    },
  ],
});
