import { gql } from '@apollo/client';

export const CREATE_SMB_BITRIX_CRM_LINK = gql`
  mutation CreateSmbBitrixCrmLink {
    createSmbBitrixCrmLink {
      url
    }
  }
`;
