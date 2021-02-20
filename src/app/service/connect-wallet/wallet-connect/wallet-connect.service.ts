import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import WalletConnectProvider from '@walletconnect/web3-provider';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import Web3 from 'web3';

import { IMessageProvider } from '../connect-wallet.service';

@Injectable({
  providedIn: 'root',
})
export class WalletsConnect {
  private connector: any;

  constructor() {}

  public async connect(provider: any): Promise<IMessageProvider> {
    return new Promise<any>(async (resolve, reject) => {
      if (provider.use === 'provider') {
        this.connector = new WalletConnectProvider({
          infuraId: provider.provider.infuraID,
        });

        await this.connector
          .enable()
          .then((info: any) => {
            console.log(info);
            const connect = {
              code: 5,
              connected: true,
              message: {
                title: 'Wallet Connect',
                text: `Wallet Connect connected.`,
              },
              provider: this.connector,
            };
            resolve(connect);
          })
          .catch(() => {
            const error = {
              code: 4,
              connected: false,
              message: {
                title: 'Wallet Connect',
                text: `User closed modal window.`,
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
    return new Observable((observer) => {
      if (!this.connector.connected) {
        this.connector.createSession();
      }

      console.log(this.connector.accounts[0]);

      // Subscribe to connection events
      this.connector.on('connect', (error, payload) => {
        if (error) {
          throw error;
        }

        // Get provided accounts and chainId
        const { accounts, chainId } = payload.params[0];

        console.log(accounts, chainId);
        console.log(payload.params[0]);
      });

      this.connector.on('disconnect', (error, payload) => {
        console.log(payload, 'disconnect');
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
