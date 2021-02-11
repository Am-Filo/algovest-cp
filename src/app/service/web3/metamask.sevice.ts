import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import Web3 from 'web3';
import { AppConfig } from '../appconfig';

@Injectable({
  providedIn: 'root',
})
export class MetamaskService {
  private metaMaskWeb3: any;

  private netVersion: number;
  private net: string;

  private providers;

  constructor(protected config: AppConfig, protected web3: Web3) {
    const appConfig = config.getConfig();

    this.netVersion = appConfig.settings.production
      ? 1
      : appConfig.settings.net;

    this.net = this.netVersion === 1 ? 'mainnet' : appConfig.settings.network;

    this.providers = {};
    this.providers.metamask = Web3.givenProvider;

    // tslint:disable-next-line: no-string-literal
    this.metaMaskWeb3 = window['ethereum'];
  }

  public getContract(abi: Array<any>, address: string): any {
    return new this.web3.eth.Contract(abi, address);
  }

  public getBalance(address: string): Promise<string> {
    return this.web3.eth.getBalance(address);
  }

  public getBlock(): Promise<any> {
    return this.web3.eth.getBlock('latest');
  }

  public gasPrice(): Promise<string> {
    return this.web3.eth.getGasPrice().then((res) => {
      return res;
    });
  }

  public encodeFunctionCall(
    name: string,
    type: any,
    inputs: Array<any>,
    params: Array<any>
  ): string {
    return this.web3.eth.abi.encodeFunctionCall(
      {
        name,
        type,
        inputs,
      },
      params
    );
  }

  public estimateGas(
    from: string,
    to: string,
    value: number,
    data: string,
    gasPrice: number
  ): Promise<any> {
    return this.web3.eth
      .estimateGas({ from, to, value, data, gasPrice })
      .then((res) => {
        return res;
      });
  }

  public async addToken(tokenOptions: any): Promise<any> {
    try {
      const wasAdded = await this.metaMaskWeb3.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: tokenOptions,
        },
      });

      if (wasAdded) {
        console.log('token added');
      }
    } catch (error) {
      console.log(error);
    }
  }

  public getAccounts(noEnable?: boolean): Observable<any> {
    const onAuth = (observer: any, address: string) => {
      if (this.web3) {
        this.web3.setProvider(this.providers.metamask);
      } else {
        this.web3 = new Web3(this.providers.metamask);
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
          msg:
            'Metamask extension is not found. You can install it from <a href="https://metamask.io" target="_blank">metamask.io</a>',
        });
      }
      return {
        unsubscribe(): any {},
      };
    });
  }
}
