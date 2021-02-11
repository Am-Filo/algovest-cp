import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { Observable } from 'rxjs';
import { AppConfig } from '../appconfig';

@Injectable({
  providedIn: 'root',
})
export class MetamaskService {
  private metaMaskWeb3: any;

  private netVersion: number;
  private net: string;

  constructor(private config: AppConfig) {
    const appConfig = this.config.getConfig();

    this.netVersion = appConfig.production ? 1 : appConfig.net;

    this.net = this.netVersion === 1 ? 'mainnet' : appConfig.network;

    this.providers = {};
    this.providers.metamask = Web3.givenProvider;

    // tslint:disable-next-line: no-string-literal
    this.metaMaskWeb3 = window['ethereum'];
  }

  private providers;
  public Web3;

  public getAccounts(noEnable?: boolean): Observable<any> {
    const onAuth = (observer: any, address: string) => {
      if (this.Web3) {
        this.Web3.setProvider(this.providers.metamask);
      } else {
        this.Web3 = new Web3(this.providers.metamask);
      }
      observer.next({
        address,
        network: this.net,
      });
      if (noEnable) {
        observer.complete();
      }
    };

    const onError = (observer, errorParams) => {
      observer.error(errorParams);
      if (noEnable) {
        observer.complete();
      }
    };

    const isValidMetaMaskNetwork = (observer, chain?) => {
      return new Promise((resolve, reject) => {
        this.metaMaskWeb3
          .request({
            method: 'net_version',
          })
          .then((result) => {
            if (this.netVersion !== Number(result)) {
              if (chain) {
                onError(observer, {
                  code: 3,
                  msg: 'Not authorized',
                });
              }

              observer.error({
                code: 2,
                msg: 'Please choose ' + this.net + ' network in Metamask.',
              });

              reject();
            }
            resolve(true);
          });
      });
    };

    return new Observable((observer) => {
      if (this.metaMaskWeb3 && this.metaMaskWeb3.isMetaMask) {
        this.metaMaskWeb3.on('chainChanged', () => {
          isValidMetaMaskNetwork(observer)
            .then(() => {
              window.location.reload();
            })
            .catch(() => {
              console.log('not valid chain');
              onError(observer, {
                code: 3,
                msg: 'Not authorized',
              });
            });
        });

        isValidMetaMaskNetwork(observer).then(() => {
          this.metaMaskWeb3.on('accountsChanged', (accounts) => {
            if (accounts.length) {
              onAuth(observer, accounts[0]);
            } else {
              onError(observer, {
                code: 3,
                msg: 'Not authorized',
              });
            }
          });

          if (!this.metaMaskWeb3.selectedAddress && !noEnable) {
            this.metaMaskWeb3.enable().catch(() => {
              onError(observer, {
                code: 3,
                msg: 'Not authorized',
              });
            });
          } else {
            if (this.metaMaskWeb3.selectedAddress) {
              onAuth(observer, this.metaMaskWeb3.selectedAddress);
            } else {
              onError(observer, {
                code: 3,
                msg: 'Not authorized',
              });
            }
          }
        });
      } else {
        onError(observer, {
          code: 1,
          msg: 'Metamask extension is not found. You can install it from <a href="https://metamask.io" target="_blank">metamask.io</a>',
        });
      }
      return {
        unsubscribe(): any {},
      };
    });
  }
}
