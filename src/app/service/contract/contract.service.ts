import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { Contract } from 'web3-eth-contract';
import BigNumber from 'bignumber.js';

import { MetamaskService } from '../metamask/metamask.service';
import { AppConfig } from '../appconfig';
import { daysValue } from 'src/app/params';
import { WalletConnectService } from '../wallet-connect/wallet-connect.service';
import { ConnectWallet } from '../connect-wallet/connect-wallet.service';

interface IConfig {
  walletConnect?: {
    providers?: any;
  };
  network?: {
    name: string;
    chainID: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  public account: any;
  private allAccountSubscribers = [];
  private allTransactionSubscribers = [];

  private CONTRACTS_PARAMS: any;
  private TokenContract: Contract;
  private StakingContract: Contract;
  private tokenAddress: string;
  private stakingAddress: string;

  private walletService: any;
  private settingsApp: IConfig = {
    network: {
      name: 'rinkeby',
      chainID: 4,
    },
  };

  constructor(private httpService: HttpClient, private config: AppConfig, private connectWallet: ConnectWallet) {}

  /**
   * Main Site Information
   * @description Get main information for site from contract.
   * @example
   * contractService.getMainInfo().then((info) => {console.log('info',info);});
   * @returns info:{totalAvs,totalStakedAVS,totalStakers,balance}
   */
  public async getMainInfo(): Promise<any> {
    const promises = [
      this.getTotalAvs().then((value) => {
        return {
          key: 'totalAvs',
          value,
        };
      }),
      this.getTotalStakedAVS().then((value) => {
        return {
          key: 'totalStakedAVS',
          value,
        };
      }),
      this.getTotalStakers().then((value) => {
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
      this.getSevenDays().then((value) => {
        return {
          key: 'sevenDays',
          value: value !== 0 ? value / 100 : 0,
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

  /**
   * Get Total AVS (Coin)
   * @description Get information about total AVS coins on contract.
   * @example
   * contractService.getTotalAvs().then((totalAvs) => {console.log('totalAvs',totalAvs);});
   * @returns totalAvs: number
   */
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

  public reserWalletService(): void {
    this.walletService = undefined;
  }

  /**
   * Get Total Staked AVS (Coin)
   * @description Get information about total staked coins on contract.
   * @example
   * contractService.totalStakedAVS().then((totalStakedAVS) => {console.log('totalStakedAVS',totalStakedAVS);});
   * @returns totalStakedAVS: number
   */
  public getTotalStakedAVS(): Promise<any> {
    return this.StakingContract.methods
      .totalStakedAVS()
      .call()
      .then(
        (value: any) => {
          return value;
        },
        (err: any) => {
          console.log('getTotalStakedAVS', err);
        }
      );
  }

  /**
   * Get Total Stakers
   * @description Get information about total contract stakers.
   * @example
   * contractService.totalStakers().then((totalStakers) => {console.log('totalStakers',totalStakers);});
   * @returns totalStakers: number
   */
  public getTotalStakers(): Promise<any> {
    return this.StakingContract.methods
      .totalStakers()
      .call()
      .then(
        (value: any) => {
          return value;
        },
        (err: any) => {
          console.log('getTotalStakers', err);
        }
      );
  }

  /**
   * Get Seven Days Info
   * @description Get information about percent avarage staking.
   * @example
   * contractService.getSevenDays().then((percent) => {console.log('percent',percent);});
   * @returns percent: number
   */
  public async getSevenDays(): Promise<any> {
    return this.StakingContract.methods
      .seven_days()
      .call()
      .then(
        (res: any) => {
          return res;
        },
        (err: any) => {
          console.log('getSevenDays', err);
          return 0;
        }
      );
  }

  /**
   * Get Contract Timestamp
   * @description Get timestamp from contract.
   * @example
   * contractService.getTimeStampFromContract().then((time) => {console.log('time',time);});
   * @returns time: number
   */
  public async getTimeStampFromContract(date: number): Promise<number> {
    return this.StakingContract.methods
      .getDayUnixTime(date)
      .call()
      .then((endDay: number) => {
        return endDay * 1000;
      });
  }

  /**
   * Get Account Stakes
   * @description Get collection of account stakes from contract.
   * @example
   * contractService.getAccountStakes().then((stakes) => {console.log('stakes',stakes);});
   * @returns stakes[]:{index: number,id: number,start: number,end: number,stakedAVS: number,totalReward: number,withdrawProgress: boolean,};
   */
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
              .then((oneSession: any) => {
                const promises = [this.getTimeStampFromContract(+oneSession.startDay), this.getTimeStampFromContract(+oneSession.startDay + +oneSession.numDaysStake)];
                const apy = daysValue.filter((t) => t.value === +oneSession.numDaysStake);
                const reward = (oneSession.stakedAVS * (apy[0].apy / 100)) / (365 * +oneSession.numDaysStake);
                return Promise.all(promises).then((stake) => {
                  return {
                    index: sessionId,
                    id: oneSession.stakeId,
                    start: stake[0],
                    end: stake[1],
                    reward,
                    stakedAVS: oneSession.stakedAVS,
                    totalReward: oneSession.freezedRewardAVSTokens,
                    withdrawProgress: false,
                  };
                });
              });
          });
          return Promise.all(sessionsPromises).then((allDeposits) => {
            return allDeposits.reverse();
          });
        } else {
          const promises = [true];
          return Promise.all(promises).then(() => {
            return 0;
          });
        }
      });
  }

  /**
   * Check Allowance
   * @description Check if address accept spend amount of coins to contract.
   * @example
   * contractService.getAllowance(amount).then(() => {},() => {});
   * @returns true | false
   */
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

  /**
   * Start Stake
   * @description Send coins to staking on contract.
   * @example
   * contractService.startStake(amount, day).then(() => {}).catch((err)=>{});
   * @returns true | false
   */
  public startStake(amount: string | number, day: number): Promise<any> {
    const stake = (resolve: any, reject: any) => {
      return this.StakingContract.methods
        .stakeStart(amount, day)
        .send({
          from: this.account.address,
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
              from: this.account.address,
            })
            .then(() => {
              stake(resolve, reject);
            }, reject);
        }
      );
    });
  }

  /**
   * Unstake
   * @description Retrive coins from staking.
   * @example
   * contractService.unstake(sessionId,id).then(()=>{console.log('complete');}).catch(() => {console.log('error');});
   * @returns true | false
   */
  public async unstake(sessionId: number, id: number): Promise<any> {
    return this.StakingContract.methods
      .stakeEnd(sessionId, id)
      .send({
        from: this.account.address,
      })
      .then((res: any) => {
        return this.checkTransaction(res);
      });
  }

  /**
   * Token Balance
   * @description Get token contract balance on eth metamask address.
   * @example
   * contractService.getTokenBalance(address).then((balance)=>{console.log('balance',balance)});
   * @returns balance: string | number
   */
  public async getTokenBalance(address?: string): Promise<string | number> {
    return this.TokenContract.methods
      .balanceOf(address ? address : this.account.address)
      .call()
      .then((balance: string | number) => {
        return balance;
      });
  }

  /**
   * Check Transaction
   * @description Checking transaction in blockchain.
   * @example
   * new Promise((resolve, reject) => {contractService.checkTx(tx, resolve, reject);});
   */
  private checkTx(tx: any, resolve: any, reject: any): void {
    this.walletService.Web3.eth.getTransaction(tx.transactionHash).then((txInfo: any) => {
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

  /**
   * Check All Transaction Subscribers
   * @description Trigger observer subscribers if transaction complete.
   * @example
   * contractService.callAllTransactionsSubscribers(txInfo);
   */
  private callAllTransactionsSubscribers(transaction: string): void {
    this.allTransactionSubscribers.forEach((observer) => {
      observer.next(transaction);
    });
  }

  /**
   * Check Transaction
   * @description Start checking transaction.
   * @example
   * contractService.checkTransaction(tx);
   * @returns value from checkTx() function
   */
  private checkTransaction(tx: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.checkTx(tx, resolve, reject);
    });
  }

  /**
   * Transaction Subscribe
   * @description Create new Observer of transactions which will add it to allTransactionSubscribers variable and return information transaction failed or successed.
   * @example
   * contractService.transactionsSubscribe().subscribe((transaction) => {console.log('success', transaction)});
   * @returns transaction: {tx: string}
   */
  public transactionsSubscribe(): Observable<any> {
    const newObserver = new Observable((observer) => {
      this.allTransactionSubscribers.push(observer);
    });
    return newObserver;
  }

  /**
   * Static information
   * @description Main initialized function which will initialized MetaMaskService, retrive account information and triggered getContractsInfo() function.
   * @example
   * contractService.getStaticInfo().then(() => {}).catch((err)=>{});
   * @returns true
   */
  public async getStaticInfo(): Promise<any> {
    // return this.initAll().then(() => {
    this.walletService = this.config.getConfig().production ? new WalletConnectService(this.config) : new MetamaskService(this.config);
    this.walletService.getAccounts().subscribe((account: any) => {
      if (account) {
        const promises = [this.getContractsInfo(false)];
        return Promise.all(promises);
      }
    });
    // });
  }

  /**
   * Get contract information.
   * @description Triggered initializeContracts() function than will add contracts abi and address to metamask configuration.
   * @example
   * contractService.getContractsInfo(false).then(() => {});
   * @returns true
   */
  private getContractsInfo(noEnable?: boolean): Promise<any> {
    if (!noEnable) {
      this.initializeContracts();
    }
    const promises = [true];
    return Promise.all(promises);
  }

  /**
   * Application initialized
   * @description Load setting and contracrs information via https from assets/js/. Set application setting and contracts.
   * @example
   * contractService.initAll().then(() => {});
   */
  private async initAll(): Promise<any> {
    const promises = [
      this.httpService
        .get(`/assets/js/settings.json?v=${new Date().getTime()}`)
        .toPromise()
        .then((config: IConfig) => {
          this.settingsApp = config ? config : this.settingsApp;
          this.config.setConfig(this.settingsApp);
        })
        .catch(() => {
          this.config.setConfig(this.settingsApp);
        }),
      this.httpService
        .get(`/assets/js/contracts.json?v=${new Date().getTime()}`)
        .toPromise()
        .then((result) => {
          return result;
        })
        .catch((err) => {
          console.log('err contracts', err);
        }),
    ];
    return Promise.all(promises).then((result) => {
      this.CONTRACTS_PARAMS = result[1][this.settingsApp.network.name];
    });
  }

  /**
   * Subscribe On Account
   * @description Push into array new account subscriber.
   * @example
   * contractService.accountSubscribe();
   */
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

  /**
   * Load account information
   * @description Triggered function callAllAccountsSubscribers.
   * @example
   * contractService.loadAccountInfo();
   */
  public loadAccountInfo(): any {
    this.callAllAccountsSubscribers();
  }

  /**
   * Update account balance
   * @description Update information about account token balance.
   * @example
   * contractService.updateBalance();
   */
  public updateBalance(): void {
    this.getTokenBalance().then((balance) => {
      this.account.balance = balance;
      this.callAllAccountsSubscribers();
    });
  }

  /**
   * All Account Subscribers
   * @description Send new account value to all account subscribers.
   * @example
   * contractService.callAllAccountsSubscribers();
   */
  private callAllAccountsSubscribers(): void {
    this.allAccountSubscribers.forEach((observer) => {
      observer.next(this.account);
    });
  }

  // public isActiveConnect(): Promise<boolean> {
  //   return new Promise((resolve: any) => {
  //     console.log(this.walletService);
  //     resolve(this.walletService === undefined ? false : true);
  //   });
  // }

  /**
   * Get account information.
   * @description Retrive infromation about account address via MetaMaskService from blockchain by address and get token address balance.
   * @example
   * contractService.getAccount().then((account) => { console.log(account); }).catch((err) => { console.log(err); });
   * @returns account: {address: string, balance: string | number}
   */
  public getAccount(noEnable?: boolean): Promise<any> {
    return new Promise((resolve: any, reject) => {
      // this.isActiveConnect().then((connected: any) => {
      console.log('this.walletService ', this.walletService);
      if (this.walletService === undefined || !this.walletService.conneced) {
        this.getStaticInfo().then((data) => console.log('data', data));
      } else {
        this.walletService.getAccounts(noEnable).subscribe(
          (account: any) => {
            console.log('dasdas', account);
            if (!this.account || account.address !== this.account.address) {
              this.account = account;
              this.getTokenBalance(account.address)
                .then((balance) => {
                  this.account.balance = balance;
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
      }
      // });

      //   this.walletService.getAccounts(noEnable).subscribe(
      //     (account: any) => {
      //       console.log('dasdas', account);
      //       if (!this.account || account.address !== this.account.address) {
      //         this.account = account;
      //         this.getTokenBalance(account.address)
      //           .then((balance) => {
      //             this.account.balance = balance;
      //             resolve(this.account);
      //           })
      //           .catch((err) => {
      //             console.log('getTokenBalance', err);
      //           });
      //       }
      //     },
      //     (err) => {
      //       this.account = false;
      //       reject(err);
      //     }
      //   );
    });
  }

  /**
   * Getting Token Address
   * @description Return adress of token contract.
   * @example
   * contractService.getContractTokenAddress();
   * @returns address
   */
  public getContractTokenAddress(): string {
    return this.tokenAddress;
  }

  /**
   * Getting Token Address
   * @description Return adress of token contract.
   * @example
   * contractService.getContractTokenAddress();
   * @returns address
   */
  public getStakingAddress(): string {
    return this.stakingAddress;
  }

  /**
   * Initialize Contracts
   * @description Send contract abi and address to web3. And set contracts addresses to variable.
   */
  private initializeContracts(): void {
    this.connectWallet.addContract({ name: 'Staking', abi: this.CONTRACTS_PARAMS.Staking.ABI, address: this.CONTRACTS_PARAMS.Staking.ADDRESS }).then((status) => console.log('Staking Contract', status));
    this.connectWallet.addContract({ name: 'Token', abi: this.CONTRACTS_PARAMS.Token.ABI, address: this.CONTRACTS_PARAMS.Token.ADDRESS }).then((status) => console.log('Token Contract', status));
    this.tokenAddress = this.CONTRACTS_PARAMS.Token.ADDRESS;
    this.stakingAddress = this.CONTRACTS_PARAMS.Staking.ADDRESS;
  }

  public initWalletConnect(name: string): void {
    const providerWallet = this.settingsApp.walletConnect.providers[name];
    const networkWallet = this.settingsApp.network;

    this.connectWallet
      .connectProvider(providerWallet, networkWallet)
      .then((connected) => {
        console.log('providerWallet connected', connected);
        if (connected) {
          this.initializeContracts();
        }
      })
      .catch((err) => {
        console.log('providerWallet err', err);
      });
  }
}
