import { ApprovalType } from '@metamask/controller-utils';
import { Json } from '@metamask/utils';
import { ApprovalFlowState } from '@metamask/approval-controller';
import { act } from '@testing-library/react';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import {
  CONFIRM_ADD_SUGGESTED_NFT_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CONNECT_ROUTE,
  DECRYPT_MESSAGE_REQUEST_PATH,
  DEFAULT_ROUTE,
  ENCRYPTION_PUBLIC_KEY_REQUEST_PATH,
} from '../../../helpers/constants/routes';
import { useConfirmationNavigation } from './useConfirmationNavigation';

jest.mock('../confirmation/templates', () => ({
  TEMPLATED_CONFIRMATION_APPROVAL_TYPES: ['wallet_addEthereumChain'],
}));

const APPROVAL_ID_MOCK = '123-456';
const APPROVAL_ID_2_MOCK = '456-789';

function renderHookWithState(state: Record<string, unknown>) {
  const { result, history } = renderHookWithProvider(
    () => useConfirmationNavigation(),
    {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        ...state,
      },
    },
  );

  return { result: result.current, history };
}

function renderHook(
  approvalType: ApprovalType,
  requestData?: Json,
  approvalFlows?: ApprovalFlowState[],
) {
  return renderHookWithState({
    pendingApprovals: {
      [APPROVAL_ID_MOCK]: {
        id: APPROVAL_ID_MOCK,
        type: approvalType,
        requestData,
      },
      [APPROVAL_ID_2_MOCK]: {
        id: APPROVAL_ID_2_MOCK,
        type: approvalType,
        requestData,
      },
    },
    approvalFlows,
  });
}

describe('useConfirmationNavigation', () => {
  // const useHistoryMock = jest.mocked(useHistory);
  // const history = { replace: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    // useHistoryMock.mockReturnValue(history);
  });

  describe('navigateToId', () => {
    it('navigates to transaction route', () => {
      // let bips;

      // bips = act(() => renderHook(ApprovalType.Transaction));
      // console.log('bips', bips);

      const { result, history } = renderHook(ApprovalType.Transaction);

      // const = await renderHook(ApprovalType.Transaction);

      act(() => result.navigateToId(APPROVAL_ID_MOCK));

      expect(history.action).toBe('REPLACE');
      expect(history.location.pathname).toBe(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_MOCK}`,
      );
    });

    it('navigates to template route', () => {
      const { result, history } = renderHook(ApprovalType.AddEthereumChain);

      act(() => result.navigateToId(APPROVAL_ID_MOCK));

      expect(history.action).toBe('REPLACE');
      expect(history.location.pathname).toBe(
        `${CONFIRMATION_V_NEXT_ROUTE}/${APPROVAL_ID_MOCK}`,
      );
    });

    it('navigates to template route if approval flow', () => {
      const { result, history } = renderHook(undefined as never, undefined, [
        {} as never,
      ]);

      act(() => result.navigateToId(undefined));

      expect(history.action).toBe('REPLACE');
      expect(history.location.pathname).toBe(`${CONFIRMATION_V_NEXT_ROUTE}`);
    });

    it('does not navigate to template route if approval flow and pending approval', () => {
      const { result, history } = renderHook(
        ApprovalType.Transaction,
        undefined,
        [{} as never],
      );

      act(() => result.navigateToId(APPROVAL_ID_MOCK));

      expect(history.action).toBe('REPLACE');
      expect(history.location.pathname).toBe(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_MOCK}`,
      );
    });

    it('navigates to connect route', () => {
      const { result, history } = renderHook(
        ApprovalType.WalletRequestPermissions,
      );

      act(() => result.navigateToId(APPROVAL_ID_MOCK));

      expect(history.action).toBe('REPLACE');
      expect(history.location.pathname).toBe(
        `${CONNECT_ROUTE}/${APPROVAL_ID_MOCK}`,
      );
    });

    it('navigates to add token route if no token ID', () => {
      const { result, history } = renderHook(ApprovalType.WatchAsset);

      act(() => result.navigateToId(APPROVAL_ID_MOCK));

      expect(history.action).toBe('REPLACE');
      expect(history.location.pathname).toBe(
        `${CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE}`,
      );
    });

    it('navigates to add NFT route if token ID', () => {
      const { result, history } = renderHook(ApprovalType.WatchAsset, {
        asset: { tokenId: '123' },
      });

      act(() => result.navigateToId(APPROVAL_ID_MOCK));

      expect(history.action).toBe('REPLACE');
      expect(history.location.pathname).toBe(
        `${CONFIRM_ADD_SUGGESTED_NFT_ROUTE}`,
      );
    });

    it('navigates to encrypt route', () => {
      const { result, history } = renderHook(
        ApprovalType.EthGetEncryptionPublicKey,
      );

      act(() => result.navigateToId(APPROVAL_ID_MOCK));

      expect(history.action).toBe('REPLACE');
      expect(history.location.pathname).toBe(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_MOCK}${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`,
      );
    });

    it('navigates to decrypt route', () => {
      const { result, history } = renderHook(ApprovalType.EthDecrypt);

      act(() => result.navigateToId(APPROVAL_ID_MOCK));

      expect(history.action).toBe('REPLACE');
      expect(history.location.pathname).toBe(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_MOCK}${DECRYPT_MESSAGE_REQUEST_PATH}`,
      );
    });

    it('does not navigate if no matching confirmation found', () => {
      const { result, history } = renderHook(ApprovalType.AddEthereumChain);

      act(() => result.navigateToId('invalidId'));

      expect(history.location.pathname).toBe(DEFAULT_ROUTE);
    });

    it('does not navigate if no confirmation ID provided', () => {
      const { result, history } = renderHook(ApprovalType.AddEthereumChain);

      act(() => result.navigateToId());

      expect(history.location.pathname).toBe(DEFAULT_ROUTE);
    });
  });

  describe('navigateToIndex', () => {
    it('navigates to the confirmation at the given index', () => {
      const { result, history } = renderHook(ApprovalType.Transaction);

      act(() => result.navigateToIndex(1));

      expect(history.action).toBe('REPLACE');
      expect(history.location.pathname).toBe(
        `${CONFIRM_TRANSACTION_ROUTE}/${APPROVAL_ID_2_MOCK}`,
      );
    });
  });

  describe('count', () => {
    it('returns the number of confirmations', () => {
      const { result } = renderHook(ApprovalType.Transaction);

      console.log('result', result);
      expect(result.count).toBe(2);
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      ['token', undefined],
      ['NFT', '123'],
    ])(
      'ignores additional watch %s approvals',
      (_title: string, tokenId?: string) => {
        const { result } = renderHookWithState({
          pendingApprovals: {
            [APPROVAL_ID_MOCK]: {
              id: APPROVAL_ID_MOCK,
              type: ApprovalType.WatchAsset,
              requestData: { asset: { tokenId } },
            },
            [APPROVAL_ID_2_MOCK]: {
              id: APPROVAL_ID_2_MOCK,
              type: ApprovalType.Transaction,
            },
            duplicate: {
              id: 'duplicate',
              type: ApprovalType.WatchAsset,
              requestData: { asset: { tokenId } },
            },
          },
        });

        expect(result.count).toBe(2);
      },
    );
  });

  describe('getIndex', () => {
    it('returns the index of the given confirmation', () => {
      const { result } = renderHook(ApprovalType.Transaction);
      expect(result.getIndex(APPROVAL_ID_2_MOCK)).toBe(1);
    });

    it('returns 0 if no confirmation ID is provided', () => {
      const { result } = renderHook(ApprovalType.Transaction);
      expect(result.getIndex()).toBe(0);
    });
  });

  describe('confirmations', () => {
    it('returns the list of confirmations', () => {
      const { result } = renderHook(ApprovalType.Transaction);
      expect(result.confirmations.map(({ id }: { id: string }) => id)).toEqual([
        APPROVAL_ID_MOCK,
        APPROVAL_ID_2_MOCK,
      ]);
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      ['token', undefined],
      ['NFT', '123'],
    ])(
      'ignores additional watch %s approvals',
      (_title: string, tokenId?: string) => {
        const { result } = renderHookWithState({
          pendingApprovals: {
            [APPROVAL_ID_MOCK]: {
              id: APPROVAL_ID_MOCK,
              type: ApprovalType.WatchAsset,
              requestData: { asset: { tokenId } },
            },
            [APPROVAL_ID_2_MOCK]: {
              id: APPROVAL_ID_2_MOCK,
              type: ApprovalType.Transaction,
            },
            duplicate: {
              id: 'duplicate',
              type: ApprovalType.WatchAsset,
              requestData: { asset: { tokenId } },
            },
          },
        });

        expect(
          result.confirmations.map(({ id }: { id: string }) => id),
        ).toEqual([APPROVAL_ID_MOCK, APPROVAL_ID_2_MOCK]);
      },
    );
  });
});
