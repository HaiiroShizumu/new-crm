// Twenty validates form steps with a schema that drops unknown keys, except
// inside a field's free-form `settings`. Everything this module adds to a form
// lives there, so the standard editor and executor keep working untouched.
export const SMB_FORM_FIELD_REQUIRED_SETTING = 'smbIsRequired';
