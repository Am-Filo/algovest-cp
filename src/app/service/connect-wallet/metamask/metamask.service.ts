import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IConnectorMessage } from '../connect-wallet.interface';
import { parameters } from '../params';

declare global {
  interface Window {
    ethereum: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class MetamaskConnect {
  private connector: any;
  private chainID: number;

  constructor() {}

  public connect(): Promise<IConnectorMessage> {
    return new Promise<any>((resolve, reject) => {
      if (typeof window.ethereum !== 'undefined') {
        this.connector = window.ethereum;
        const connect: IConnectorMessage = {
          code: 1,
          connected: true,
          provider: 'Web3',
          message: {
            title: 'Success',
            subtitle: 'Connect success',
            text: `Metamask found and connected.`,
          },
        };
        resolve(connect);
      }

      const error = {
        code: 2,
        connected: false,
        message: {
          title: 'Error',
          subtitle: 'Error connect',
          text: `Metamask not found, please install it from <a href='https://metamask.io/' target="_blank">metamask.io</a>.`,
        },
      };
      reject(error);
    });
  }

  public getAccounts(): Observable<any> {
    const onError = (observer: any, errorParams: any) => {
      observer.error(errorParams);
    };

    const onNext = (observer: any, nextParams: any) => {
      observer.next(nextParams);
    };

    return new Observable((observer) => {
      if (this.connector && this.connector.isMetaMask) {
        this.connector.on('chainChanged', (chainId: string) => {
          onNext(observer, { address: this.connector.selectedAddress, network: parameters.chainsMap[chainId] });
        });

        this.connector.on('accountsChanged', (address: Array<any>) => {
          if (address.length) {
            onNext(observer, { address: address[0], network: parameters.chainsMap[parameters.chainIDMap[+this.chainID]] });
          } else {
            onError(observer, {
              code: 3,
              message: {
                title: 'Error',
                subtitle: 'Authorized error',
                message: 'You are not authorized.',
              },
            });
          }
        });

        if (!this.connector.selectedAddress) {
          this.connector.enable().catch(() => {
            onError(observer, {
              code: 3,
              message: {
                title: 'Error',
                subtitle: 'Authorized error',
                message: 'You are not authorized.',
              },
            });
          });
        } else {
          if (this.connector.selectedAddress) {
            this.connector
              .request({
                method: 'net_version',
              })
              .then((chainID: string) => {
                this.chainID = +chainID;
                onNext(observer, { address: this.connector.selectedAddress, network: parameters.chainsMap[parameters.chainIDMap[+chainID]] });
              });
          } else {
            onError(observer, {
              code: 3,
              message: {
                title: 'Error',
                subtitle: 'Authorized error',
                message: 'You are not authorized.',
              },
            });
          }
        }
      }

      return {
        unsubscribe(): any {},
      };
    });
  }
}
