import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// import BigNumber from 'bignumber.js';
import { Contract } from 'web3-eth-contract';

import { MetamaskService } from '../metamask/metamask.service';
import { AppConfig } from '../appconfig';

interface Config {
  production: boolean;
  network: string;
  net: number;
}

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private metaMaskWeb3: any;
  public account: any;
  private allAccountSubscribers = [];

  private StakingContract: Contract;
  private tokensDecimals: any = {
    ETH: 18,
  };
  private CONTRACTS_PARAMS: any;
  public tokenAddress = 'none';

  public settingsApp = {
    production: false,
    network: 'ropsten',
    net: 3,
  };

  constructor(private httpService: HttpClient, private config: AppConfig) {}

  public getZeroDayStartTime(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.StakingContract.methods
        .zeroDayStartTime()
        .call()
        .then((res: any) => {
          console.log('zeroDayStartTime', res);
          resolve(res);
        });
    });
  }

  public getDayDurationSec(): Promise<any> {
    // console.log(this.StakingContract);
    // return new Promise((resolve, reject) => {
    return this.StakingContract.methods
      .dayDurationSec()
      .call()
      .then(
        (res: any) => {
          console.log('dayDurationSec', res);
          return res;
        },
        (err: any) => {
          console.log('err', err);
        }
      );
    // });
  }

  public currentDay(): Promise<any> {
    // console.log(this.StakingContract);
    // return new Promise((resolve, reject) => {

    return new Promise((resolve, reject) => {
      return this.StakingContract.methods
        .currentDay()
        .call()
        .then((day) => {
          console.log('day', day);
          resolve(0);
          // this.callAllAccountsSubscribers();
        });
    });
    // return this.StakingContract.methods
    //   .currentDay()
    //   .call()
    //   .then(
    //     (res: any) => {
    //       console.log('currentDay', res);
    //       return res;
    //     },
    //     (err: any) => {
    //       console.log('err', err);
    //     }
    //   );
    // });
  }

  public async getStakingContractInfo(): Promise<any> {
    const promises = [
      this.StakingContract.methods
        .zeroDayStartTime()
        .call()
        .then((zeroDayStartTime) => {
          return {
            key: 'zeroDayStartTime',
            value: zeroDayStartTime,
          };
        }),
      this.StakingContract.methods
        .unfreezedAVSTokens()
        .call()
        .then((result) => {
          return {
            key: 'unfreezedAVSTokens',
            value: result,
          };
        }),
    ];
    return Promise.all(promises).then((results) => {
      const values = {};
      results.forEach((v) => {
        values[v.key] = v.value;
      });
      return values;
    });
  }

  public async getStaticInfo(): Promise<any> {
    return this.initAll().then(() => {
      this.metaMaskWeb3 = new MetamaskService(this.config);
      this.metaMaskWeb3.getAccounts().subscribe((account: any) => {
        if (account) {
          this.initializeContracts();
          const promises = [this.getTokensInfo(true)];
          return Promise.all(promises);
        }
      });
    });
  }

  private getTokensInfo(noEnable?: boolean): Promise<any> {
    if (!noEnable) {
      this.initializeContracts();
    }

    const promises = [true];
    // const promises = [
    //   this.StakingContract.methods
    //     .decimals()
    //     .call()
    //     .then((decimals: any) => {
    //       this.tokensDecimals.H2T = decimals;
    //     }),
    // ];

    return Promise.all(promises);
  }

  private async initAll(): Promise<any> {
    const promises = [
      this.httpService
        .get(`/assets/js/settings.json?v=${new Date().getTime()}`)
        .toPromise()
        .then((config: Config) => {
          this.settingsApp = config ? config : this.settingsApp;
          this.config.setConfig(this.settingsApp);
        })
        .catch(() => {
          this.config.setConfig(this.settingsApp);
        }),
      this.httpService
        .get(`/assets/js/constants.json?v=${new Date().getTime()}`)
        .toPromise()
        .then((result) => {
          return result;
        })
        .catch((err) => {
          console.log('err constants', err);
        }),
    ];

    return Promise.all(promises).then((result) => {
      this.CONTRACTS_PARAMS = result[1][this.settingsApp.production ? 'mainnet' : this.settingsApp.network];
    });
  }

  // public updateH2TBalance(callEmitter?): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     if (!(this.account && this.account.address)) {
  //       return reject();
  //     }
  //     return this.StakingContract.methods
  //       .balanceOf(this.account.address)
  //       .call()
  //       .then((balance) => {
  //         const bigBalance = new BigNumber(balance);
  //         this.account.balances = this.account.balances || {};
  //         this.account.balances.H2T = {
  //           wei: balance,
  //           weiBigNumber: bigBalance,
  //           shortBigNumber: bigBalance.div(new BigNumber(10).pow(this.tokensDecimals.H2T)),
  //           display: bigBalance.div(new BigNumber(10).pow(this.tokensDecimals.H2T)).toFormat(4),
  //         };
  //         resolve(0);
  //         if (callEmitter) {
  //           this.callAllAccountsSubscribers();
  //         }
  //       });
  //   });
  // }

  public loadAccountInfo(): any {
    // const promises = [this.updateH2TBalance()];
    // Promise.all(promises).then((res) => {
    //   console.log(res);
    //   this.callAllAccountsSubscribers();
    // });
    this.callAllAccountsSubscribers();
  }

  private callAllAccountsSubscribers(): void {
    this.allAccountSubscribers.forEach((observer) => {
      observer.next(this.account);
    });
  }

  public getAccount(noEnable?: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      this.metaMaskWeb3.getAccounts(noEnable).subscribe(
        (account: any) => {
          if (!this.account || account.address !== this.account.address) {
            this.account = account;
          }
          resolve(this.account);
        },
        (err) => {
          this.account = false;
          reject(err);
        }
      );
    });
  }

  public getCoinsDecimals(): void {
    return this.tokensDecimals;
  }

  public getContractAddress(): string {
    return this.tokenAddress;
  }

  public accountSubscribe(): Observable<any> {
    const newObserver = new Observable((observer) => {
      observer.next(this.account);
      this.allAccountSubscribers.push(observer);
      return {
        unsubscribe: () => {
          this.allAccountSubscribers = this.allAccountSubscribers.filter((a) => a !== newObserver);
        },
      };
    });
    return newObserver;
  }

  private initializeContracts(): void {
    this.StakingContract = this.metaMaskWeb3.getContract(this.CONTRACTS_PARAMS.Staking.ABI, this.CONTRACTS_PARAMS.Staking.ADDRESS);
    this.tokenAddress = this.CONTRACTS_PARAMS.Staking.ADDRESS;
  }
}
