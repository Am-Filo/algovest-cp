import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import WalletConnectProvider from '@walletconnect/web3-provider';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';

import { IConnectorMessage } from '../connect-wallet.interface';
import { parameters } from '../params';

@Injectable({
  providedIn: 'root',
})
export class WalletsConnect {
  private connector: any;

  constructor() {}

  public async connect(provider: any): Promise<IConnectorMessage> {
    return new Promise<any>(async (resolve, reject) => {
      if (provider.use === 'provider') {
        this.connector = new WalletConnectProvider({
          infuraId: provider.provider.infuraID,
        });

        await this.connector
          .enable()
          .then((info: any) => {
            // console.log('info qr code', info);

            const connect: IConnectorMessage = {
              code: 1,
              connected: true,
              provider: this.connector,
              message: {
                title: 'Success',
                subtitle: 'Wallet Connect',
                text: `Wallet Connect connected.`,
              },
            };

            resolve(connect);
          })
          .catch(() => {
            const error = {
              code: 5,
              connected: false,
              message: {
                title: 'Error',
                subtitle: 'Error connect',
                text: `User closed qr modal window.`,
              },
            };
            reject(error);
          });
      } else if (provider.use === 'bridge') {
        this.connector = new WalletConnect({
          bridge: provider.bridge.url,
          qrcodeModal: QRCodeModal,
        });
      }
    });
  }

  public getProvider(): any {
    return this.connector;
  }

  public getAccounts(): Observable<any> {
    const onError = (observer: any, errorParams: any) => {
      observer.error(errorParams);
    };

    const onNext = (observer: any, nextParams: any) => {
      observer.next(nextParams);
    };

    return new Observable((observer) => {
      if (!this.connector.connected) {
        this.connector.createSession();
      }

      // console.log('wallet connect subscribe first return', this.connector, this.connector.accounts[0], this.connector.chainId);

      onNext(observer, { address: this.connector.accounts[0], network: parameters.chainsMap[parameters.chainIDMap[this.connector.chainId]] });

      // Subscribe to connection events
      this.connector.on('connect', (error: any, payload: any) => {
        if (error) {
          // console.log('wallet connect on connect error', error, payload);
          onError(observer, {
            code: 3,
            message: {
              title: 'Error',
              subtitle: 'Authorized error',
              message: 'You are not authorized.',
            },
          });
        }

        // Get provided accounts and chainId
        const { accounts, chainId } = payload.params[0];

        // console.log(accounts, chainId, payload.params[0]);

        onNext(observer, { address: accounts, network: chainId });
      });

      this.connector.on('disconnect', (error, payload) => {
        // console.log(payload, 'disconnect');

        if (error) {
          console.log('wallet connect on connect error', error, payload);
          onError(observer, {
            code: 6,
            message: {
              title: 'Error',
              subtitle: 'Disconnect',
              message: 'Wallet disconnected',
            },
          });
        }
      });

      this.connector.on('wc_sessionUpdate', (error, payload) => {
        console.log(payload, 'wc_sessionUpdate');
      });

      this.connector.on('wc_sessionRequest', (error, payload) => {
        console.log(payload, 'wc_sessionRequest');
      });

      this.connector.on('call_request', (error, payload) => {
        console.log(payload, 'call_request');
      });

      this.connector.on('session_update', (error, payload) => {
        console.log(payload, 'session_update');
      });

      this.connector.on('session_request', (error, payload) => {
        console.log(payload, 'session_request');
      });

      return {
        unsubscribe(): any {},
      };
    });
  }
}
