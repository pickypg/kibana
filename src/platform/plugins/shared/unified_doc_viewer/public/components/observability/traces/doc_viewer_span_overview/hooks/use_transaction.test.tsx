/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { lastValueFrom } from 'rxjs';
import { getUnifiedDocViewerServices } from '../../../../../plugin';
import { TransactionProvider, useTransactionContext } from './use_transaction';
import { TRANSACTION_DURATION_FIELD, TRANSACTION_NAME_FIELD } from '@kbn/discover-utils';

jest.mock('../../../../../plugin', () => ({
  getUnifiedDocViewerServices: jest.fn(),
}));

jest.mock('rxjs', () => {
  const originalModule = jest.requireActual('rxjs');
  return {
    ...originalModule,
    lastValueFrom: jest.fn(),
  };
});

const mockSearch = jest.fn();
const mockAddDanger = jest.fn();
(getUnifiedDocViewerServices as jest.Mock).mockReturnValue({
  data: {
    search: {
      search: mockSearch,
    },
  },
  core: {
    notifications: {
      toasts: {
        addDanger: mockAddDanger,
      },
    },
  },
});

const lastValueFromMock = lastValueFrom as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  lastValueFromMock.mockReset();
});

describe('useTransaction hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TransactionProvider transactionId="test-transaction" indexPattern="test-index">
      {children}
    </TransactionProvider>
  );

  it('should start with loading true and transaction as null', async () => {
    lastValueFromMock.mockResolvedValue({});

    const { result } = renderHook(() => useTransactionContext(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(lastValueFrom).toHaveBeenCalledTimes(1);
  });

  it('should update transaction when data is fetched successfully', async () => {
    const transactionName = 'Test Transaction';
    const transactionDuration = 1;
    lastValueFromMock.mockResolvedValue({
      rawResponse: {
        hits: {
          hits: [
            {
              fields: {
                [TRANSACTION_NAME_FIELD]: transactionName,
                [TRANSACTION_DURATION_FIELD]: transactionDuration,
              },
            },
          ],
        },
      },
    });

    const { result } = renderHook(() => useTransactionContext(), { wrapper });

    await waitFor(() => !result.current.loading);

    expect(result.current.loading).toBe(false);
    expect(result.current.transaction?.name).toBe(transactionName);
    expect(result.current.transaction?.duration).toBe(transactionDuration);
    expect(lastValueFrom).toHaveBeenCalledTimes(1);
  });

  it('should handle errors and set transaction to null, and show a toast error', async () => {
    const errorMessage = 'Search error';
    lastValueFromMock.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useTransactionContext(), { wrapper });

    await waitFor(() => !result.current.loading);

    expect(result.current.loading).toBe(false);
    expect(result.current.transaction).toBeNull();
    expect(lastValueFrom).toHaveBeenCalledTimes(1);
    expect(mockAddDanger).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'An error occurred while fetching the transaction',
        text: errorMessage,
      })
    );
  });

  it('should set transaction to null and stop loading when transactionId is not provided', async () => {
    const wrapperWithoutTransactionId = ({ children }: { children: React.ReactNode }) => (
      <TransactionProvider transactionId={undefined} indexPattern="test-index">
        {children}
      </TransactionProvider>
    );

    const { result } = renderHook(() => useTransactionContext(), {
      wrapper: wrapperWithoutTransactionId,
    });

    await waitFor(() => !result.current.loading);

    expect(result.current.loading).toBe(false);
    expect(result.current.transaction).toBeNull();
    expect(lastValueFrom).not.toHaveBeenCalled();
  });
});
