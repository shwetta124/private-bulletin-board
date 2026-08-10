// This file is part of midnightntwrk/example-bboard.
// Copyright (C) Midnight Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  BBoardAPI,
  type BBoardProviders,
  type DeployedBBoardAPI,
} from '../../../api/src/index';

import {
  type ContractAddress,
  fromHex,
  toHex,
} from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';

import {
  BehaviorSubject,
  catchError,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  type Observable,
  take,
  tap,
  throwError,
  timeout,
} from 'rxjs';

import { pipe as fnPipe } from 'fp-ts/function';
import { type Logger } from 'pino';

import {
  type ConnectedAPI,
  type InitialAPI,
} from '@midnight-ntwrk/dapp-connector-api';

import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';

import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';

import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';

import semver from 'semver';

import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';

import { BBoardPrivateState } from '@midnight-ntwrk/bboard-contract';

import { inMemoryPrivateStateProvider } from '../in-memory-private-state-provider';

import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';

import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';

/**
 * An in-progress bulletin board deployment.
 */
export interface InProgressBoardDeployment {
  readonly status: 'in-progress';
}

/**
 * A deployed bulletin board deployment.
 */
export interface DeployedBoardDeployment {
  readonly status: 'deployed';

  /**
   * The DeployedBBoardAPI instance when connected
   * to an on-network bulletin board contract.
   */
  readonly api: DeployedBBoardAPI;
}

/**
 * A failed bulletin board deployment.
 */
export interface FailedBoardDeployment {
  readonly status: 'failed';

  /**
   * The error that caused the deployment to fail.
   */
  readonly error: Error;
}

/**
 * A bulletin board deployment.
 */
export type BoardDeployment =
  | InProgressBoardDeployment
  | DeployedBoardDeployment
  | FailedBoardDeployment;

/**
 * Provides access to bulletin board deployments.
 */
export interface DeployedBoardAPIProvider {
  /**
   * Gets the observable set of board deployments.
   */
  readonly boardDeployments$: Observable<
    Array<Observable<BoardDeployment>>
  >;

  /**
   * Joins or deploys a bulletin board contract.
   *
   * If a contract address is provided, the method joins
   * that existing contract. Otherwise it deploys a new one.
   */
  readonly resolve: (
    contractAddress?: ContractAddress,
  ) => Observable<BoardDeployment>;
}

/**
 * A DeployedBoardAPIProvider that manages bulletin board
 * deployments in a browser setting.
 */
export class BrowserDeployedBoardManager
  implements DeployedBoardAPIProvider
{
  readonly #boardDeploymentsSubject: BehaviorSubject<
    Array<BehaviorSubject<BoardDeployment>>
  >;

  #initializedProviders:
    | Promise<BBoardProviders>
    | undefined;

  constructor(private readonly logger: Logger) {
    this.#boardDeploymentsSubject =
      new BehaviorSubject<
        Array<BehaviorSubject<BoardDeployment>>
      >([]);

    this.boardDeployments$ =
      this.#boardDeploymentsSubject;
  }

  /**
   * Observable list of board deployments.
   */
  readonly boardDeployments$: Observable<
    Array<Observable<BoardDeployment>>
  >;

  /**
   * Deploy a new board or join an existing board.
   */
  resolve(
    contractAddress?: ContractAddress,
  ): Observable<BoardDeployment> {
    const deployments =
      this.#boardDeploymentsSubject.value;

    let deployment =
      deployments.find(
        (item) =>
          item.value.status === 'deployed' &&
          item.value.api.deployedContractAddress ===
            contractAddress,
      );

    if (deployment) {
      return deployment;
    }

    deployment =
      new BehaviorSubject<BoardDeployment>({
        status: 'in-progress',
      });

    if (contractAddress) {
      void this.joinDeployment(
        deployment,
        contractAddress,
      );
    } else {
      void this.deployDeployment(deployment);
    }

    this.#boardDeploymentsSubject.next([
      ...deployments,
      deployment,
    ]);

    return deployment;
  }

  /**
   * Get the configured Midnight providers.
   */
  private getProviders(): Promise<BBoardProviders> {
    if (!this.#initializedProviders) {
      this.#initializedProviders =
        initializeProviders(this.logger);
    }

    return this.#initializedProviders;
  }

  /**
   * Deploy a new bulletin board.
   */
  private async deployDeployment(
    deployment: BehaviorSubject<BoardDeployment>,
  ): Promise<void> {
    try {
      const providers =
        await this.getProviders();

      const api = await BBoardAPI.deploy(
        providers,
        this.logger,
      );

      deployment.next({
        status: 'deployed',
        api,
      });
    } catch (error: unknown) {
      deployment.next({
        status: 'failed',
        error:
          error instanceof Error
            ? error
            : new Error(String(error)),
      });
    }
  }

  /**
   * Join an existing bulletin board.
   */
  private async joinDeployment(
    deployment: BehaviorSubject<BoardDeployment>,
    contractAddress: ContractAddress,
  ): Promise<void> {
    try {
      const providers =
        await this.getProviders();

      const api = await BBoardAPI.join(
        providers,
        contractAddress,
        this.logger,
      );

      deployment.next({
        status: 'deployed',
        api,
      });
    } catch (error: unknown) {
      deployment.next({
        status: 'failed',
        error:
          error instanceof Error
            ? error
            : new Error(String(error)),
      });
    }
  }
}

/**
 * Initialize all providers required by the BBoard API.
 */
const initializeProviders = async (
  logger: Logger,
): Promise<BBoardProviders> => {
  const networkId =
    import.meta.env.VITE_NETWORK_ID as NetworkId;

  const connectedAPI =
    await connectToWallet(
      logger,
      networkId,
    );

  const zkConfigPath =
    window.location.origin;

   const keyMaterialProvider =
  new FetchZkConfigProvider(
    zkConfigPath,
    fetch.bind(window),
  ) as unknown as BBoardProviders['zkConfigProvider'];

  const config =
    await connectedAPI.getConfiguration();

  const privateStateProvider =
    inMemoryPrivateStateProvider<
      string,
      BBoardPrivateState
    >();

  const shieldedAddresses =
    await connectedAPI.getShieldedAddresses();

  return {
    privateStateProvider,

    zkConfigProvider:
      keyMaterialProvider,

    proofProvider:
      httpClientProofProvider(
        config.proverServerUri!,
        keyMaterialProvider,
      ),

    publicDataProvider:
      indexerPublicDataProvider(
        config.indexerUri,
        config.indexerWsUri,
      ),

    walletProvider: {
      getCoinPublicKey(): string {
        return shieldedAddresses.shieldedCoinPublicKey;
      },

      getEncryptionPublicKey(): string {
        return shieldedAddresses.shieldedEncryptionPublicKey;
      },

      balanceTx: async (
        tx: UnboundTransaction,
        ttl?: Date,
      ) => {
        try {
          logger.info(
            { tx, ttl },
            'Balancing transaction via wallet',
          );

          const serializedTx =
            toHex(tx.serialize());

          const received =
            await connectedAPI.balanceUnsealedTransaction(
              serializedTx,
            );

          return Transaction.deserialize<
            SignatureEnabled,
            Proof,
            Binding
          >(
            'signature',
            'proof',
            'binding',
            fromHex(received.tx),
          );
        } catch (error) {
          logger.error(
            { error },
            'Error balancing transaction via wallet',
          );

          throw error;
        }
      },
    },

    midnightProvider: {
      submitTx: async (
        tx: FinalizedTransaction,
      ) => {
        await connectedAPI.submitTransaction(
          toHex(tx.serialize()),
        );

        const txIdentifiers =
          tx.identifiers();

        const txId =
          txIdentifiers[0];

        logger.info(
          { txIdentifiers },
          'Submitted transaction via wallet',
        );

        return txId;
      },
    },
  };
};

/**
 * Find a compatible Midnight wallet.
 */
const getFirstCompatibleWallet =
  (): InitialAPI | undefined => {
    if (!window.midnight) {
      return undefined;
    }

    const wallets =
      Object.values(window.midnight).filter(
        (
          wallet,
        ): wallet is InitialAPI =>
          !!wallet &&
          typeof wallet === 'object' &&
          'apiVersion' in wallet &&
          semver.satisfies(
            wallet.apiVersion,
            COMPATIBLE_CONNECTOR_API_VERSION,
          ),
      );

    const oneAmWallet =
      wallets.find(
        (wallet) =>
          wallet.name
            ?.toLowerCase()
            .includes('1am') ||
          wallet.rdns
            ?.toLowerCase()
            .includes('1am'),
      );

    return oneAmWallet ?? wallets[0];
  };

const COMPATIBLE_CONNECTOR_API_VERSION =
  '4.x';

/**
 * Connect to the Midnight wallet.
 */
const connectToWallet = (
  logger: Logger,
  networkId: string,
): Promise<ConnectedAPI> => {
  return firstValueFrom(
    fnPipe(
      interval(100),

      map(() =>
        getFirstCompatibleWallet(),
      ),

      tap((connectorAPI) => {
        logger.info(
          connectorAPI,
          'Checking for wallet connector API',
        );
      }),

      filter(
        (
          connectorAPI,
        ): connectorAPI is InitialAPI =>
          !!connectorAPI,
      ),

      tap((connectorAPI) => {
        logger.info(
          connectorAPI,
          'Compatible wallet connector API found. Connecting.',
        );
      }),

      take(1),

      timeout({
        first: 1000,

        with: () =>
          throwError(
            () =>
              new Error(
                'Could not find Midnight Lace wallet. Extension installed?',
              ),
          ),
      }),

      concatMap(
        async (initialAPI) => {
          const connectedAPI =
            await initialAPI.connect(
              networkId,
            );

          const connectionStatus =
            await connectedAPI.getConnectionStatus();

          logger.info(
            connectionStatus,
            'Wallet connector API enabled status',
          );

          return connectedAPI;
        },
      ),

      timeout({
        first: 5000,

        with: () =>
          throwError(
            () =>
              new Error(
                'Midnight Lace wallet has failed to respond. Extension enabled?',
              ),
          ),
      }),

      catchError((error: unknown) => {
        logger.error(
          { error },
          'Unable to enable connector API',
        );

        return throwError(
          () =>
            new Error(
              'Application is not authorized',
            ),
        );
      }),
    ),
  );
};