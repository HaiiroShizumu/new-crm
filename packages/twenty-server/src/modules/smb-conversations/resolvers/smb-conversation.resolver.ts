import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Int, Mutation, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { AddSmbConversationMembersInput } from 'src/modules/smb-conversations/dtos/add-smb-conversation-members.input';
import { CreateSmbGroupConversationInput } from 'src/modules/smb-conversations/dtos/create-smb-group-conversation.input';
import { EditSmbConversationMessageInput } from 'src/modules/smb-conversations/dtos/edit-smb-conversation-message.input';
import { SendSmbConversationMessageInput } from 'src/modules/smb-conversations/dtos/send-smb-conversation-message.input';
import { SmbConversationDTO } from 'src/modules/smb-conversations/dtos/smb-conversation.dto';
import { SmbConversationMessagePageDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-message-page.dto';
import { SmbConversationMessageDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-message.dto';
import { SmbConversationService } from 'src/modules/smb-conversations/services/smb-conversation.service';
import { SmbConversationMessageService } from 'src/modules/smb-conversations/services/smb-conversation-message.service';
import { SmbConversationsExceptionFilter } from 'src/modules/smb-conversations/smb-conversations-exception.filter';
import { assertSmbWorkspaceMemberId } from 'src/modules/smb-conversations/utils/assert-smb-workspace-member-id.util';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';

// NoPermissionGuard: у бесед нет флага роли. Доступ решается членством в
// беседе внутри сервисов (ADR-010 п.2).
// Только люди. Сеансы имперсонации не допускаются намеренно: поддержка,
// вошедшая «как пользователь», не должна читать и писать его переписку.
@CoreResolver()
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: false,
      playground: false,
      workspaceAgnostic: false,
    },
    apiKey: false,
    oauthClient: false,
    application: false,
  }),
  NoPermissionGuard,
)
@UsePipes(ResolverValidationPipe)
@UseFilters(
  SmbConversationsExceptionFilter,
  PreventNestToAutoLogGraphqlErrorsFilter,
  AuthGraphqlApiExceptionFilter,
)
export class SmbConversationResolver {
  constructor(
    private readonly conversationService: SmbConversationService,
    private readonly messageService: SmbConversationMessageService,
  ) {}

  @Query(() => [SmbConversationDTO])
  async messengerConversations(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<SmbConversationDTO[]> {
    assertSmbWorkspaceMemberId(workspaceMemberId);

    return this.conversationService.getConversations({
      workspaceId: workspace.id,
      workspaceMemberId,
    });
  }

  @Query(() => SmbConversationDTO)
  async messengerConversation(
    @Args('conversationId', { type: () => UUIDScalarType })
    conversationId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<SmbConversationDTO> {
    assertSmbWorkspaceMemberId(workspaceMemberId);

    return this.conversationService.getConversation({
      workspaceId: workspace.id,
      workspaceMemberId,
      conversationId,
    });
  }

  @Query(() => SmbConversationMessagePageDTO)
  async messengerMessages(
    @Args('conversationId', { type: () => UUIDScalarType })
    conversationId: string,
    @Args('beforeSeq', { type: () => Int, nullable: true })
    beforeSeq: number | null,
    @Args('afterSeq', { type: () => Int, nullable: true })
    afterSeq: number | null,
    @Args('limit', { type: () => Int, nullable: true }) limit: number | null,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<SmbConversationMessagePageDTO> {
    assertSmbWorkspaceMemberId(workspaceMemberId);

    return this.messageService.getMessages({
      workspaceId: workspace.id,
      workspaceMemberId,
      conversationId,
      beforeSeq,
      afterSeq,
      limit,
    });
  }

  @Mutation(() => SmbConversationDTO)
  async openMessengerDirectConversation(
    @Args('colleagueWorkspaceMemberId', { type: () => UUIDScalarType })
    colleagueWorkspaceMemberId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<SmbConversationDTO> {
    assertSmbWorkspaceMemberId(workspaceMemberId);

    return this.conversationService.openDirectConversation({
      workspaceId: workspace.id,
      workspaceMemberId,
      colleagueWorkspaceMemberId,
    });
  }

  @Mutation(() => SmbConversationDTO)
  async createMessengerGroupConversation(
    @Args('input') input: CreateSmbGroupConversationInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<SmbConversationDTO> {
    assertSmbWorkspaceMemberId(workspaceMemberId);

    return this.conversationService.createGroupConversation({
      workspaceId: workspace.id,
      workspaceMemberId,
      name: input.name,
      workspaceMemberIds: input.workspaceMemberIds,
    });
  }

  @Mutation(() => SmbConversationDTO)
  async addMessengerConversationMembers(
    @Args('input') input: AddSmbConversationMembersInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<SmbConversationDTO> {
    assertSmbWorkspaceMemberId(workspaceMemberId);

    return this.conversationService.addMembers({
      workspaceId: workspace.id,
      workspaceMemberId,
      conversationId: input.conversationId,
      workspaceMemberIds: input.workspaceMemberIds,
    });
  }

  @Mutation(() => SmbConversationMessageDTO)
  async sendMessengerMessage(
    @Args('input') input: SendSmbConversationMessageInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<SmbConversationMessageDTO> {
    assertSmbWorkspaceMemberId(workspaceMemberId);

    const { message } = await this.messageService.sendMessage({
      workspaceId: workspace.id,
      workspaceMemberId,
      conversationId: input.conversationId,
      clientMessageId: input.clientMessageId,
      body: input.body,
    });

    return message;
  }

  @Mutation(() => SmbConversationMessageDTO)
  async editMessengerMessage(
    @Args('input') input: EditSmbConversationMessageInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<SmbConversationMessageDTO> {
    assertSmbWorkspaceMemberId(workspaceMemberId);

    return this.messageService.editMessage({
      workspaceId: workspace.id,
      workspaceMemberId,
      messageId: input.messageId,
      body: input.body,
    });
  }

  @Mutation(() => SmbConversationMessageDTO)
  async deleteMessengerMessage(
    @Args('messageId', { type: () => UUIDScalarType }) messageId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<SmbConversationMessageDTO> {
    assertSmbWorkspaceMemberId(workspaceMemberId);

    return this.messageService.deleteMessage({
      workspaceId: workspace.id,
      workspaceMemberId,
      messageId,
    });
  }

  @Mutation(() => Int)
  async markMessengerConversationAsRead(
    @Args('conversationId', { type: () => UUIDScalarType })
    conversationId: string,
    @Args('seq', { type: () => Int, nullable: true }) seq: number | null,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<number> {
    assertSmbWorkspaceMemberId(workspaceMemberId);

    return this.conversationService.markRead({
      workspaceId: workspace.id,
      workspaceMemberId,
      conversationId,
      seq,
    });
  }

  @Mutation(() => Boolean)
  async sendMessengerTyping(
    @Args('conversationId', { type: () => UUIDScalarType })
    conversationId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<boolean> {
    assertSmbWorkspaceMemberId(workspaceMemberId);

    await this.conversationService.sendTyping({
      workspaceId: workspace.id,
      workspaceMemberId,
      conversationId,
    });

    return true;
  }
}
