import { defineView, ViewType } from 'twenty-sdk/define';

import {
  FEED_POST_OBJECT_UNIVERSAL_IDENTIFIER,
  ALL_FEED_POSTS_VIEW_UNIVERSAL_IDENTIFIER,
  ALL_FEED_POSTS_VIEW_FIELD_0_UNIVERSAL_IDENTIFIER,
  FEED_POST_TITLE_UNIVERSAL_IDENTIFIER,
  ALL_FEED_POSTS_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
  POST_AUTHOR_UNIVERSAL_IDENTIFIER,
  ALL_FEED_POSTS_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
  FEED_POST_AUDIENCE_UNIVERSAL_IDENTIFIER,
  ALL_FEED_POSTS_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
  FEED_POST_ISPINNED_UNIVERSAL_IDENTIFIER,
  ALL_FEED_POSTS_VIEW_FIELD_4_UNIVERSAL_IDENTIFIER,
  FEED_POST_ISIMPORTANT_UNIVERSAL_IDENTIFIER,
  ALL_FEED_POSTS_VIEW_FIELD_5_UNIVERSAL_IDENTIFIER,
  FEED_POST_PUBLISHEDAT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_FEED_POSTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Все посты',
  objectUniversalIdentifier: FEED_POST_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconNews',
  position: 0,
  fields: [
    {
      universalIdentifier: ALL_FEED_POSTS_VIEW_FIELD_0_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: FEED_POST_TITLE_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 260,
    },
    {
      universalIdentifier: ALL_FEED_POSTS_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: POST_AUTHOR_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: ALL_FEED_POSTS_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: FEED_POST_AUDIENCE_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: ALL_FEED_POSTS_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: FEED_POST_ISPINNED_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: ALL_FEED_POSTS_VIEW_FIELD_4_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        FEED_POST_ISIMPORTANT_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: ALL_FEED_POSTS_VIEW_FIELD_5_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        FEED_POST_PUBLISHEDAT_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 160,
    },
  ],
});
