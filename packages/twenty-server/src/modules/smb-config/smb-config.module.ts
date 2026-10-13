import { Module } from '@nestjs/common';

import { SmbConfigService } from 'src/modules/smb-config/smb-config.service';

@Module({
  providers: [SmbConfigService],
  exports: [SmbConfigService],
})
export class SmbConfigModule {}
