import {
  FieldType,
  OnDeleteAction,
  RelationType,
  defineField,
} from 'twenty-sdk/define';

import {
  ACK_POST_UNIVERSAL_IDENTIFIER,
  POST_ACKNOWLEDGEMENTS_UNIVERSAL_IDENTIFIER,
  FEED_POST_OBJECT_UNIVERSAL_IDENTIFIER,
  FEED_ACKNOWLEDGEMENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: ACK_POST_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: FEED_ACKNOWLEDGEMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'post',
  label: 'Пост',
  icon: 'IconNews',
  relationTargetObjectMetadataUniversalIdentifier:
    FEED_POST_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    POST_ACKNOWLEDGEMENTS_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'postId',
  },
});
