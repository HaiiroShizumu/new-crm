import { Injectable } from '@nestjs/common';

import { type SmbBitrixConfig } from 'src/modules/smb-config/types/smb-bitrix-config.type';
import { type SmbLiveKitConfig } from 'src/modules/smb-config/types/smb-live-kit-config.type';
import { type SmbVapidConfig } from 'src/modules/smb-config/types/smb-vapid-config.type';
import { parseSmbEnv } from 'src/modules/smb-config/utils/parse-smb-env.util';

// Fork settings are read here instead of being added to config-variables.ts:
// that file is one of the most frequently changed upstream, and every variable
// added there is a merge conflict waiting on the next update.
@Injectable()
export class SmbConfigService {
  readonly bitrix: SmbBitrixConfig | undefined;
  readonly liveKit: SmbLiveKitConfig | undefined;
  readonly vapid: SmbVapidConfig | undefined;

  constructor() {
    const { bitrix, liveKit, vapid } = parseSmbEnv(process.env);

    this.bitrix = bitrix;
    this.liveKit = liveKit;
    this.vapid = vapid;
  }
}
