import { getSmbDocumentPreviewKind } from '@/smb-docflow/utils/getSmbDocumentPreviewKind';

describe('getSmbDocumentPreviewKind', () => {
  it.each([
    ['scan.PNG', 'IMAGE'],
    ['photo.final.jpeg', 'IMAGE'],
    ['contract.pdf', 'PDF'],
    ['Contract.PDF', 'PDF'],
    ['table.xlsx', 'OTHER'],
    ['README', 'OTHER'],
    ['pdf', 'OTHER'],
    ['', 'OTHER'],
  ])('%s is shown as %s', (fileName, expectedKind) => {
    expect(getSmbDocumentPreviewKind(fileName)).toBe(expectedKind);
  });
});
