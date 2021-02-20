import { Injectable } from '@angular/core';
import { IMessageProvider } from '../connect-wallet.service';

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

  constructor() {}

  public connect(): Promise<IMessageProvider> {
    return new Promise<any>((resolve, reject) => {
      if (typeof window.ethereum !== 'undefined') {
        this.connector = window.ethereum;
        const connect = {
          code: 5,
          connected: true,
          message: {
            title: 'Metamask',
            text: `Metamask found and connected.`,
          },
          provider: 'Web3',
        };
        resolve(connect);
      }

      const error = {
        code: 4,
        connected: false,
        message: {
          title: 'Metamask Error',
          text: `Metamask not found, please install it from <a href='https://metamask.io/' target="_blank">metamask.io</a>.`,
        },
      };
      reject(error);
    });
  }

  // public getAccounts(noEnable?: boolean): Observable<any> {
  //   const onAuth = (observer: any, address: string) => {
  //     if (this.Web3) {
  //       this.Web3.setProvider(this.providers.metamask);
  //     } else {
  //       this.Web3 = new Web3(this.providers.metamask);
  //     }
  //     observer.next({
  //       address,
  //       network: this.net,
  //     });
  //     if (noEnable) {
  //       observer.complete();
  //     }
  //   };

  //   const onError = (observer: any, errorParams: any) => {
  //     observer.error(errorParams);
  //     if (noEnable) {
  //       observer.complete();
  //     }
  //   };

  //   const isValidMetaMaskNetwork = (observer: any, chain?: string | boolean | number) => {
  //     return new Promise((resolve, reject) => {
  //       this.metaMaskWeb3
  //         .request({
  //           method: 'net_version',
  //         })
  //         .then((result: string | number) => {
  //           if (this.netVersion !== Number(result)) {
  //             if (chain) {
  //               onError(observer, {
  //                 code: 3,
  //                 msg: 'Not authorized',
  //                 title: 'Metamask Error',
  //               });
  //             }
  //             observer.error({
  //               code: 2,
  //               msg: 'Please choose ' + this.net + ' network in Metamask.',
  //               title: 'Metamask Error',
  //             });

  //             reject();
  //           }
  //           resolve(true);
  //         });
  //     });
  //   };

  //   return new Observable((observer) => {
  //     if (this.metaMaskWeb3 && this.metaMaskWeb3.isMetaMask) {
  //       this.metaMaskWeb3.on('chainChanged', () => {
  //         isValidMetaMaskNetwork(observer)
  //           .then(() => {
  //             window.location.reload();
  //           })
  //           .catch(() => {
  //             onError(observer, {
  //               code: 3,
  //               msg: 'Not authorized',
  //               title: 'Metamask Error',
  //             });
  //           });
  //       });

  //       isValidMetaMaskNetwork(observer).then(() => {
  //         this.metaMaskWeb3.on('accountsChanged', (accounts: Array<any>) => {
  //           if (accounts.length) {
  //             onAuth(observer, accounts[0]);
  //           } else {
  //             onError(observer, {
  //               code: 3,
  //               msg: 'Not authorized',
  //               title: 'Metamask Error',
  //             });
  //           }
  //         });

  //         if (!this.metaMaskWeb3.selectedAddress && !noEnable) {
  //           this.metaMaskWeb3.enable().catch(() => {
  //             onError(observer, {
  //               code: 3,
  //               msg: 'Not authorized',
  //               title: 'Metamask Error',
  //             });
  //           });
  //         } else {
  //           if (this.metaMaskWeb3.selectedAddress) {
  //             onAuth(observer, this.metaMaskWeb3.selectedAddress);
  //           } else {
  //             onError(observer, {
  //               code: 3,
  //               msg: 'Not authorized',
  //               title: 'Metamask Error',
  //             });
  //           }
  //         }
  //       });
  //     } else {
  //       onError(observer, {
  //         code: 1,
  //         msg: 'Metamask extension is not found. You can install it from <a href="https://metamask.io" target="_blank">metamask.io</a>',
  //         title: 'Metamask Error',
  //       });
  //     }
  //     return {
  //       unsubscribe(): any {},
  //     };
  //   });
  // }
}
