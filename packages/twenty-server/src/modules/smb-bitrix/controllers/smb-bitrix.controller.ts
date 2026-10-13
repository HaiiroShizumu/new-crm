import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { type Request, type Response } from 'express';

import { I18nService } from 'src/engine/core-modules/i18n/i18n.service';
import {
  SMB_BITRIX_RATE_LIMIT_MAX_REQUESTS,
  SMB_BITRIX_RATE_LIMIT_WINDOW_MS,
} from 'src/modules/smb-bitrix/constants/smb-bitrix-rate-limit.constant';
import { SMB_BITRIX_ROUTE_PREFIX } from 'src/modules/smb-bitrix/constants/smb-bitrix-route-prefix.constant';
import { SmbBitrixLaunchService } from 'src/modules/smb-bitrix/services/smb-bitrix-launch.service';
import {
  SmbBitrixException,
  SmbBitrixExceptionCode,
} from 'src/modules/smb-bitrix/smb-bitrix.exception';
import { parseSmbBitrixLaunchBody } from 'src/modules/smb-bitrix/utils/parse-smb-bitrix-launch-body.util';
import { renderSmbBitrixPage } from 'src/modules/smb-bitrix/utils/render-smb-bitrix-page.util';
import { ThrottlerService } from 'src/engine/core-modules/throttler/throttler.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

const PAGE_LOCALE = 'ru-RU';

const UNEXPECTED_ERROR_MESSAGE = msg`Something went wrong. Reopen the application.`;

// Public by necessity: Bitrix24 calls these addresses before anyone is signed
// in. Each handler proves the request itself (see SmbBitrixOauthService).
@Controller(SMB_BITRIX_ROUTE_PREFIX)
@UseGuards(PublicEndpointGuard, NoPermissionGuard)
export class SmbBitrixController {
  private readonly logger = new Logger(SmbBitrixController.name);

  constructor(
    private readonly launchService: SmbBitrixLaunchService,
    private readonly throttlerService: ThrottlerService,
    private readonly i18nService: I18nService,
  ) {}

  @Post('install')
  @HttpCode(200)
  async install(
    @Body() body: unknown,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    try {
      await this.throttle('install', request);

      const { isActive } = await this.launchService.install(
        parseSmbBitrixLaunchBody(body),
      );

      this.sendPage(response, {
        title: msg`Application installed`,
        message: isActive
          ? msg`Employees can now open it from the Bitrix24 menu.`
          : msg`We are preparing your workspace and will let you know when it is ready.`,
        shouldFinishInstall: true,
      });
    } catch (error) {
      this.sendError(response, error);
    }
  }

  @Post('app')
  async open(
    @Body() body: unknown,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    try {
      await this.throttle('app', request);

      const url = await this.launchService.open(parseSmbBitrixLaunchBody(body));

      // 303: the iframe arrived with a POST and must continue with a GET.
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader('Referrer-Policy', 'no-referrer');
      response.redirect(303, url);
    } catch (error) {
      this.sendError(response, error);
    }
  }

  @Post('event')
  @HttpCode(200)
  async event(
    @Body() body: unknown,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    try {
      await this.throttle('event', request);
      await this.launchService.handleEvent(parseSmbBitrixLaunchBody(body));

      response.json({ ok: true });
    } catch (error) {
      this.logFailure(error);
      response.status(403).json({ ok: false });
    }
  }

  private async throttle(endpoint: string, request: Request): Promise<void> {
    await this.throttlerService.atomicTokenBucketThrottleOrThrow({
      key: `smb-bitrix:${endpoint}:${request.ip}`,
      maxTokens: SMB_BITRIX_RATE_LIMIT_MAX_REQUESTS,
      timeWindow: SMB_BITRIX_RATE_LIMIT_WINDOW_MS,
    });
  }

  private sendPage(
    response: Response,
    {
      title,
      message,
      shouldFinishInstall,
      status = 200,
    }: {
      title: MessageDescriptor;
      message: MessageDescriptor;
      shouldFinishInstall?: boolean;
      status?: number;
    },
  ): void {
    response.setHeader('Cache-Control', 'no-store');
    response
      .status(status)
      .type('html')
      .send(
        renderSmbBitrixPage({
          title: this.translate(title),
          message: this.translate(message),
          shouldFinishInstall,
        }),
      );
  }

  private sendError(response: Response, error: unknown): void {
    this.logFailure(error);

    const isKnownError = error instanceof SmbBitrixException;

    this.sendPage(response, {
      title: msg`The application could not be opened`,
      message: isKnownError
        ? error.userFriendlyMessage
        : UNEXPECTED_ERROR_MESSAGE,
      status:
        isKnownError &&
        error.code !== SmbBitrixExceptionCode.PORTAL_REQUEST_FAILED &&
        error.code !== SmbBitrixExceptionCode.NOT_CONFIGURED
          ? 403
          : 503,
    });
  }

  private logFailure(error: unknown): void {
    if (error instanceof SmbBitrixException) {
      this.logger.warn(`${error.code}: ${error.message}`);

      return;
    }

    this.logger.error('Bitrix24 request failed', error);
  }

  private translate(descriptor: MessageDescriptor): string {
    return this.i18nService.translateMessage({
      messageId: descriptor.id,
      locale: PAGE_LOCALE,
    });
  }
}
