import { gql } from '@apollo/client';

export const SET_USER_VARS = gql`
  mutation SetUserVars($key: String!, $value: JSON!) {
    setUserVars(key: $key, value: $value)
  }
`;
