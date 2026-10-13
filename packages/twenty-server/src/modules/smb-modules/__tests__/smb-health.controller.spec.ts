import { Test } from '@nestjs/testing';

import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { SmbHealthController } from 'src/modules/smb-modules/controllers/smb-health.controller';
import { setSmbModulesVersionStatus } from 'src/modules/smb-modules/utils/smb-modules-version-status';

describe('SmbHealthController', () => {
  let controller: SmbHealthController;

  beforeEach(async () => {
    const testingModule = await Test.createTestingModule({
      controllers: [SmbHealthController],
    })
      .overrideGuard(PublicEndpointGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(NoPermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = testingModule.get(SmbHealthController);
  });

  afterEach(() => {
    setSmbModulesVersionStatus(null);
  });

  it('отдаёт not_checked до первой сверки', () => {
    expect(controller.check().status).toBe('not_checked');
  });

  it('отдаёт warning при расхождении версий', () => {
    setSmbModulesVersionStatus({
      checkedAt: 'now',
      mismatches: [
        {
          key: 'absences',
          applicationUniversalIdentifier: 'uuid',
          expectedVersion: '1.4.0',
          installedVersions: [],
        },
      ],
    });

    expect(controller.check().status).toBe('warning');
  });
});
