import { parseSmbBitrixPerson } from 'src/modules/smb-bitrix/utils/parse-smb-bitrix-person.util';

describe('parseSmbBitrixPerson', () => {
  it('reads a portal user', () => {
    expect(
      parseSmbBitrixPerson({
        ID: '17',
        EMAIL: ' Anna@Example.com ',
        NAME: 'Anna',
        LAST_NAME: 'Petrova',
      }),
    ).toEqual({
      bitrixUserId: '17',
      email: 'anna@example.com',
      firstName: 'Anna',
      lastName: 'Petrova',
    });
  });

  it('accepts a numeric id', () => {
    expect(parseSmbBitrixPerson({ ID: 17 })?.bitrixUserId).toBe('17');
  });

  it('keeps the person but drops an email that is not an address', () => {
    expect(parseSmbBitrixPerson({ ID: '1', EMAIL: 'no-email' })).toEqual({
      bitrixUserId: '1',
      email: undefined,
      firstName: '',
      lastName: '',
    });
  });

  it('returns nothing without an id', () => {
    expect(parseSmbBitrixPerson({ EMAIL: 'a@b.ru' })).toBeUndefined();
    expect(parseSmbBitrixPerson(null)).toBeUndefined();
  });
});
