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
  public Web3: any;
  private metaMaskWeb3: any;
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

  /**
   * Get Balance
   * @description Get account balance from ethereum blockchain.
   * @example
   * metamaskService.getBalance(address).then((balance: string | number)=> {console.log('balance',balance)})
   * @returns Promise<string | number>
   */
  public getBalance(address: string): Promise<string | number> {
    return this.Web3.eth.getBalance(address);
  }

  /**
   * Get Contract
   * @description Add contract abi and address to web3 and get access to contract methods.
   * @example
   * metamaskService.getContract(abi,address);
   */
  public getContract(abi: Array<any>, address: string): void {
    return new this.Web3.eth.Contract(abi, address);
  }

  /**
   * Get Account
   * @description Get an user account. Check if user have metamask and logged into then return account address if chain equal settings chain.
   *
   * If user don't have metamask then throw new error to setup metamask first.<br />
   * If user not logged into metamask then throw new error not authorized.<br />
   * If user matamask chain not equal settings chain then throw new error to settings current chain.<br />
   * if everything is ok return user address.
   * @example
   * metamaskService.getAccounts().subscribe((account: any)=> {console.log('account',account)});
   * @returns Observable<any>
   */
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

    const onError = (observer: any, errorParams: any) => {
      observer.error(errorParams);
      if (noEnable) {
        observer.complete();
      }
    };

    const isValidMetaMaskNetwork = (observer: any, chain?: string | boolean | number) => {
      return new Promise((resolve, reject) => {
        this.metaMaskWeb3
          .request({
            method: 'net_version',
          })
          .then((result: string | number) => {
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
