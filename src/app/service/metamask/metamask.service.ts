import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfig } from '../appconfig';
import Web3 from 'web3';

declare global {
  interface Window {
    ethereum: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class MetamaskService {
  private metaMaskWeb3: any;
  public Web3: any;
  private providers: any;

  private netVersion: number;
  private net: string;

  constructor(private config: AppConfig) {
    const appConfig = this.config.getConfig();

    this.netVersion = appConfig.production ? 1 : appConfig.net;
    this.net = this.netVersion === 1 ? 'mainnet' : appConfig.network;

    this.providers = {};
    this.providers.metamask = Web3.givenProvider;

    if (typeof window.ethereum !== 'undefined') {
      this.metaMaskWeb3 = window.ethereum;
    }
  }

  public getBalance(address): Promise<any> {
    return this.Web3.eth.getBalance(address);
  }

  public getContract(abi: Array<any>, address: string): void {
    return new this.Web3.eth.Contract(abi, address);
  }

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
                  title: 'Metamask Error',
                });
              }

              observer.error({
                code: 2,
                msg: 'Please choose ' + this.net + ' network in Metamask.',
                title: 'Metamask Error',
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
              onError(observer, {
                code: 3,
                msg: 'Not authorized',
                title: 'Metamask Error',
              });
            });
        });

        isValidMetaMaskNetwork(observer).then(() => {
          this.metaMaskWeb3.on('accountsChanged', (accounts: Array<any>) => {
            if (accounts.length) {
              onAuth(observer, accounts[0]);
            } else {
              onError(observer, {
                code: 3,
                msg: 'Not authorized',
                title: 'Metamask Error',
              });
            }
          });

          if (!this.metaMaskWeb3.selectedAddress && !noEnable) {
            this.metaMaskWeb3.enable().catch(() => {
              onError(observer, {
                code: 3,
                msg: 'Not authorized',
                title: 'Metamask Error',
              });
            });
          } else {
            if (this.metaMaskWeb3.selectedAddress) {
              onAuth(observer, this.metaMaskWeb3.selectedAddress);
            } else {
              onError(observer, {
                code: 3,
                msg: 'Not authorized',
                title: 'Metamask Error',
              });
            }
          }
        });
      } else {
        onError(observer, {
          code: 1,
          msg: 'Metamask extension is not found. You can install it from <a href="https://metamask.io" target="_blank">metamask.io</a>',
          title: 'Metamask Error',
        });
      }
      return {
        unsubscribe(): any {},
      };
    });
  }
}
