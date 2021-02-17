import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import BigNumber from 'bignumber.js';
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
  private allTransactionSubscribers = [];

  public avsAddress: string;

  private TokenContract: Contract;
  private tokenAddress: string;

  private StakingContract: Contract;
  public stakingAddress: string;

  private tokensDecimals: any = {
    ETH: 18,
  };
  private CONTRACTS_PARAMS: any;

  public settingsApp = {
    production: false,
    network: 'ropsten',
    net: 3,
  };

  constructor(private httpService: HttpClient, private config: AppConfig) {}

  public async getMainInfo(): Promise<any> {
    const promises = [
      this.getTotalAvs().then((value) => {
        return {
          key: 'totalAvs',
          value,
        };
      }),
      this.totalStakedAVS().then((value) => {
        return {
          key: 'totalStakedAVS',
          value,
        };
      }),
      this.totalStakers().then((value) => {
        return {
          key: 'totalStakers',
          value,
        };
      }),
      this.getTokenBalance().then((value) => {
        return {
          key: 'balance',
          value,
        };
      }),
      // this.getSevenDays().then((value) => {
      //   return {
      //     key: 'sevenDays',
      //     value,
      //   };
      // }),
    ];

    return Promise.all(promises).then((results) => {
      const values = {};
      results.forEach((v) => {
        values[v.key] = v.value;
      });
      return values;
    });
  }

  public getAvsAddress(): Promise<any> {
    return this.StakingContract.methods
      .avsAddress()
      .call()
      .then(
        (value: any) => {
          this.avsAddress = value;
          return value;
        },
        (err: any) => {
          console.log('getTotalAvs', err);
        }
      );
  }

  public getTotalAvs(): Promise<any> {
    return this.TokenContract.methods
      .totalSupply()
      .call()
      .then(
        (value: any) => {
          return value;
        },
        (err: any) => {
          console.log('getTotalAvs', err);
        }
      );
  }

  public getFreezedAVSTokens(): Promise<any> {
    return this.StakingContract.methods
      .freezedAVSTokens()
      .call()
      .then(
        (value: any) => {
          return value;
        },
        (err: any) => {
          console.log('getFreezedAVSTokens', err);
        }
      );
  }

  public totalStakedAVS(): Promise<any> {
    return this.StakingContract.methods
      .totalStakedAVS()
      .call()
      .then(
        (value: any) => {
          return value;
        },
        (err: any) => {
          console.log('totalStakedAVS', err);
        }
      );
  }

  public totalStakers(): Promise<any> {
    return this.StakingContract.methods
      .totalStakers()
      .call()
      .then(
        (value: any) => {
          return value;
        },
        (err: any) => {
          console.log('totalStakers', err);
        }
      );
  }

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

  public async getAccountStakes(): Promise<any> {
    return this.StakingContract.methods
      .stakeListCount(this.account.address)
      .call()
      .then((sessions: any) => {
        if (sessions !== '0' && sessions !== 0) {
          const sessionsIds = [];
          for (let i = 0; i < sessions; i++) {
            sessionsIds.push(i);
          }
          const sessionsPromises = sessionsIds.map((sessionId) => {
            return this.StakingContract.methods
              .stakeList(this.account.address, sessionId)
              .call()
              .then((oneSession) => {
                const promises = [
                  this.StakingContract.methods
                    .getDayUnixTime(oneSession.startDay)
                    .call()
                    .then((startDay: number) => {
                      return startDay * 1000;
                    }),
                  this.StakingContract.methods
                    .getDayUnixTime(oneSession.startDay + oneSession.numDaysStake)
                    .call()
                    .then((endDay: number) => {
                      return endDay * 1000;
                    }),
                ];

                return Promise.all(promises).then((stake) => {
                  return {
                    index: sessionId,
                    id: oneSession.stakeId,
                    start: stake[0],
                    end: stake[1],
                    stakedAVS: oneSession.stakedAVS,
                    totalReward: oneSession.freezedRewardAVSTokens,
                    withdrawProgress: false,
                  };
                });
              });
          });
          return Promise.all(sessionsPromises).then((allDeposits) => {
            console.log(allDeposits);
            return allDeposits;
          });
        } else {
          const promises = [true];
          return Promise.all(promises).then(() => {
            return 0;
          });
        }
      });
  }

  public async getSevenDays(): Promise<any> {
    return this.StakingContract.methods
      .seven_days()
      .call()
      .then((res: any) => {
        return res;
      });
  }

  public getDayDurationSec(): Promise<any> {
    return this.StakingContract.methods
      .dayDurationSec()
      .call()
      .then(
        (res: any) => {
          return res;
        },
        (err: any) => {
          console.log('err', err);
        }
      );
  }

  private getAllowance(amount: string | number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.TokenContract.methods
        .allowance(this.account.address, this.stakingAddress)
        .call()
        .then((allowance: string) => {
          const allow = new BigNumber(allowance);
          const allowed = allow.minus(amount);
          allowed.isNegative() ? reject() : resolve(1);
        });
    });
  }

  public async unstake(sessionId: number, id: number): Promise<any> {
    return this.StakingContract.methods
      .stakeEnd(sessionId, id)
      .send({
        from: this.account.address,
      })
      .then((res) => {
        return this.checkTransaction(res);
      });
  }

  public startStake(amount: string | number, day: number): Promise<any> {
    const fromAccount = this.account.address;

    const stake = (resolve, reject) => {
      return this.StakingContract.methods
        .stakeStart(amount, day)
        .send({
          from: fromAccount,
        })
        .then((res) => {
          return this.checkTransaction(res);
        })
        .then(resolve, reject);
    };

    return new Promise((resolve, reject) => {
      this.getAllowance(amount).then(
        () => {
          stake(resolve, reject);
        },
        () => {
          this.TokenContract.methods
            .approve(this.stakingAddress, amount)
            .send({
              from: fromAccount,
            })
            .then(() => {
              stake(resolve, reject);
            }, reject);
        }
      );
    });
  }

  public currentDay(): Promise<any> {
    return this.StakingContract.methods
      .currentDay()
      .call()
      .then(
        (res: any) => {
          return res;
        },
        (err: any) => {
          console.log('err', err);
        }
      );
  }

  public async getTokenBalance(address?: string): Promise<any> {
    return this.TokenContract.methods
      .balanceOf(address ? address : this.account.address)
      .call()
      .then((balance: any) => {
        return balance;
      });
  }

  private checkTx(tx: any, resolve: any, reject: any): void {
    this.metaMaskWeb3.Web3.eth.getTransaction(tx.transactionHash).then((txInfo) => {
      if (txInfo.blockNumber) {
        this.callAllTransactionsSubscribers(txInfo);
        resolve(tx);
      } else {
        setTimeout(() => {
          this.checkTx(tx, resolve, reject);
        }, 2000);
      }
    }, reject);
  }

  private callAllTransactionsSubscribers(transaction: any): void {
    this.allTransactionSubscribers.forEach((observer) => {
      observer.next(transaction);
    });
  }

  private checkTransaction(tx: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.checkTx(tx, resolve, reject);
    });
  }

  public transactionsSubscribe(): Observable<any> {
    const newObserver = new Observable((observer) => {
      this.allTransactionSubscribers.push(observer);
    });
    return newObserver;
  }

  public async getStaticInfo(): Promise<any> {
    return this.initAll().then(() => {
      this.metaMaskWeb3 = new MetamaskService(this.config);
      this.metaMaskWeb3.getAccounts().subscribe((account: any) => {
        if (account) {
          const promises = [this.getTokensInfo(false)];
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

  public loadAccountInfo(): any {
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
            this.getTokenBalance(account.address)
              .then((value) => {
                this.account.balance = value;
                resolve(this.account);
              })
              .catch((err) => {
                console.log('getTokenBalance', err);
              });
          }
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

  public getContractTokenAddress(): string {
    return this.tokenAddress;
  }

  public getStakingAddress(): string {
    return this.stakingAddress;
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
    this.TokenContract = this.metaMaskWeb3.getContract(this.CONTRACTS_PARAMS.Token.ABI, this.CONTRACTS_PARAMS.Token.ADDRESS);

    this.tokenAddress = this.CONTRACTS_PARAMS.Token.ADDRESS;
    this.stakingAddress = this.CONTRACTS_PARAMS.Staking.ADDRESS;
  }
}
