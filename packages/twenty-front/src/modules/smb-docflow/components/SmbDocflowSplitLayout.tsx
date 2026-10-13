import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode } from 'react';
import { IconX } from 'twenty-ui/icon';
import { LightIconButton } from 'twenty-ui/components';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledSplit = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  position: relative;
`;

const StyledMain = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow-y: auto;
`;

// Панель смонтирована всегда, чтобы ширина успела анимироваться: закрытая — 0.
const StyledPreview = styled.aside<{ isOpen: boolean }>`
  border-left: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  flex-shrink: 0;
  overflow: hidden;
  transition: width calc(${themeCssVariables.animation.duration.normal} * 1s);
  width: ${({ isOpen }) => (isOpen ? '360px' : '0px')};

  @media (max-width: 900px) {
    background: ${themeCssVariables.background.primary};
    border-left: none;
    inset: 0;
    position: absolute;
    visibility: ${({ isOpen }) => (isOpen ? 'visible' : 'hidden')};
    width: auto;
  }
`;

const StyledPreviewHeader = styled.div`
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]} 0;
`;

const StyledPreviewBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]}
    ${themeCssVariables.spacing[4]};
`;

type SmbDocflowSplitLayoutProps = {
  children: ReactNode;
  preview?: ReactNode;
  onClose: () => void;
};

// A list on the left and what is selected in it on the right: the shape all
// three docflow tabs share.
export const SmbDocflowSplitLayout = ({
  children,
  preview,
  onClose,
}: SmbDocflowSplitLayoutProps) => {
  const { t } = useLingui();
  const isOpen = preview !== undefined && preview !== null;

  return (
    <StyledSplit>
      <StyledMain>{children}</StyledMain>
      <StyledPreview isOpen={isOpen} aria-hidden={!isOpen}>
        <StyledPreviewHeader>
          <LightIconButton
            aria-label={t`Закрыть`}
            tabIndex={isOpen ? undefined : -1}
            onClick={onClose}
          >
            <IconX />
          </LightIconButton>
        </StyledPreviewHeader>
        <StyledPreviewBody>{preview}</StyledPreviewBody>
      </StyledPreview>
    </StyledSplit>
  );
};
