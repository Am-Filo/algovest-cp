import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import BigNumber from 'bignumber.js';

import { ConnectWallet } from '../connect-wallet/connect-wallet.service';

import { AppConfig } from '../appconfig';
import { daysValue } from 'src/app/params';

interface IConfig {
  walletConnect?: {
    providers?: any;
    settings?: {
      providerType?: boolean;
    };
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
  private connectWallet: any;

  private CONTRACTS_PARAMS: any;
  private tokenAddress: string;
  private stakingAddress: string;

  private settingsApp: IConfig = {
    network: {
      name: 'rinkeby',
      chainID: 4,
    },
  };

  constructor(private httpService: HttpClient, private config: AppConfig) {}

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
          value: !isNaN(value) && value !== 0 ? value / 100 : 0,
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
    return this.connectWallet
      .Contract('Token')
      .methods.totalSupply()
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

  /**
   * Get Total Staked AVS (Coin)
   * @description Get information about total staked coins on contract.
   * @example
   * contractService.totalStakedAVS().then((totalStakedAVS) => {console.log('totalStakedAVS',totalStakedAVS);});
   * @returns totalStakedAVS: number
   */
  public getTotalStakedAVS(): Promise<any> {
    return this.connectWallet
      .Contract('Staking')
      .methods.totalStakedAVS()
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
    return this.connectWallet
      .Contract('Staking')
      .methods.totalStakers()
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
    return this.connectWallet
      .Contract('Staking')
      .methods.seven_days()
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
    return this.connectWallet
      .Contract('Staking')
      .methods.getDayUnixTime(date)
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
    return this.connectWallet
      .Contract('Staking')
      .methods.stakeListCount(this.account.address)
      .call()
      .then((sessions: any) => {
        if (sessions !== '0' && sessions !== 0) {
          const sessionsIds = [];
          for (let i = 0; i < sessions; i++) {
            sessionsIds.push(i);
          }
          const sessionsPromises = sessionsIds.map((sessionId) => {
            return this.connectWallet
              .Contract('Staking')
              .methods.stakeList(this.account.address, sessionId)
              .call()
              .then((oneSession: any) => {
                const promises = [this.getTimeStampFromContract(+oneSession.startDay), this.getTimeStampFromContract(+oneSession.startDay + +oneSession.numDaysStake)];
                const apy = daysValue.filter((t) => t.value === +oneSession.numDaysStake);
                return Promise.all(promises).then((stake) => {
                  const start = stake[0];
                  const end = stake[1];
                  const diffDays = Math.ceil(Math.abs(end - +new Date()) / (1000 * 60 * 60 * 24));
                  const dayStake = diffDays > +oneSession.numDaysStake ? +oneSession.numDaysStake : diffDays;
                  const rewardFull = (oneSession.stakedAVS * (apy[0].apy / 100)) / (365 * +dayStake);
                  const rewardPercent = rewardFull * (diffDays > +oneSession.numDaysStake ? 0.02 : 0.2);
                  const reward = rewardFull - rewardPercent;

                  console.log(`start day: ${start}`, `end day: ${end}`, `staking days: ${+oneSession.numDaysStake}`, `diff days: ${diffDays}`, rewardFull, rewardPercent, reward);

                  return {
                    index: sessionId,
                    id: oneSession.stakeId,
                    start,
                    end,
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
      this.connectWallet
        .Contract('Token')
        .methods.allowance(this.account.address, this.stakingAddress)
        .call()
        .then((allowance: string) => {
          const allow = new BigNumber(allowance);
          const allowed = allow.minus(amount);
          console.log('allowance', allowance);
          allowed.isNegative() ? reject() : resolve(1);
        });
    });
  }

  /**
   * Start Stake
   * @description Send coins to staking on contract.
   * @example
   * contractService.stake(amount, day).then(() => {}).catch((err)=>{});
   * @returns true | false
   */
  public stake(amount: string | number, day: number): Promise<any> {
    const stake = (resolve: any, reject: any) => {
      return this.connectWallet
        .Contract('Staking')
        .methods.stakeStart(amount, day)
        .send({
          from: this.account.address,
        })
        .then((tx: any) => {
          const { transactionHash } = tx;
          console.log('stake', tx, transactionHash);

          return this.connectWallet.txCheck(transactionHash).then(
            (result) => {
              console.log('start stake check transaction result', result);
            },
            (err) => {
              console.log('start stake check transaction error', err);
              if (err === null || undefined) {
                this.connectWallet.clTxSubscribers(transactionHash);
              }
            }
          );
        })
        .then(resolve, reject);
    };
    return new Promise((resolve, reject) => {
      this.getAllowance(amount).then(
        () => {
          stake(resolve, reject);
        },
        () => {
          this.connectWallet
            .Contract('Token')
            .methods.approve(this.stakingAddress, amount)
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
    return this.connectWallet
      .Contract('Staking')
      .methods.stakeEnd(sessionId, id)
      .send({
        from: this.account.address,
      })
      .then((tx: any) => {
        const { transactionHash } = tx;
        console.log('stakeEnd', tx, transactionHash);

        return this.connectWallet.txCheck(transactionHash).then(
          (result) => {
            console.log('unstake tx result', result);
          },
          (err) => {
            console.log('unstake tx error', err);
            if (err === null || undefined) {
              this.connectWallet.clTxSubscribers(transactionHash);
            }
          }
        );
      });
  }

  /**
   * Transaction Subscribe
   * @description Create new Observer of transactions which will add it to allTransactionSubscribers variable and return information transaction failed or successed.
   * @example
   * contractService.txSubscribe().subscribe((txInfo) => {console.log('transaction', txInfo)});
   * @returns transaction: {tx: string}
   */
  public txSubscribe(): Observable<any> {
    return new Observable((observer) => {
      this.connectWallet.txSubscribe().subscribe(
        (txInfo: string) => {
          console.log(txInfo);
          observer.next(txInfo);
        },
        (error) => {
          observer.error(error);
        }
      );
      return {
        unsubscribe(): any {},
      };
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
    return this.connectWallet
      .Contract('Token')
      .methods.balanceOf(address ? address : this.account.address)
      .call()
      .then((balance: string | number) => {
        return balance;
      });
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
   * Load account information
   * @description Triggered function callAllAccountsSubscribers.
   * @example
   * contractService.loadAccountInfo();
   */
  public loadAccountInfo(): any {
    this.callAllAccountsSubscribers();
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

  /**
   * Get account information.
   * @description Retrive infromation about account address via MetaMaskService from blockchain by address and get token address balance.
   * @example
   * contractService.getAccount().then((account) => { console.log(account); }).catch((err) => { console.log(err); });
   * @returns account: {address: string, balance: string | number}
   */
  public getAccount(): Promise<any> {
    return new Promise((resolve: any, reject) => {
      this.connectWallet.getAccounts().subscribe(
        (account: any) => {
          if (!this.account || account.address !== this.account.address) {
            this.account = account;
            this.getTokenBalance(account.address)
              .then((balance) => {
                this.account.balance = balance;
                resolve(this.account);
              })
              .catch((err) => {
                console.log('getTokenBalance', err);
              })
              .finally(() => this.callAllAccountsSubscribers());
          }
        },
        (err: any) => {
          this.account = false;
          this.callAllAccountsSubscribers();
          reject(err);
        }
      );
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
   * Reset Wallet Connect
   * @description This function do the same as logout by creating new connectWallet and reset account.
   * @example
   * contractService.resetConnection();
   * @returns address
   */
  public resetConnection(): void {
    this.account = null;
    this.connectWallet = new ConnectWallet();
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

  /**
   * Initialize Wallet Connect
   * @description Setup an connection type.
   * @example
   * contractService.initWalletConnect('MetaMask');
   * @returns Promise<true/false>
   */
  public async initWalletConnect(name: string): Promise<boolean> {
    const providerWallet = this.settingsApp.walletConnect.providers[name];
    const connectSetting = this.settingsApp.walletConnect.settings;
    const networkWallet = this.settingsApp.network;

    const connecting = this.connectWallet
      .connectProvider(providerWallet, networkWallet, connectSetting)
      .then((connected) => {
        if (connected) {
          this.initializeContracts();
        }
        return connected;
      })
      .catch((err) => {
        console.log('initWalletConnect providerWallet err', err);
      });

    return Promise.all([connecting]).then((connect: any) => {
      return connect[0];
    });
  }

  /**
   * Application initialized
   * @description Load setting and contracrs information via https from assets/js/. Set application setting and contracts.
   * @example
   * contractService.initAll().then(() => {});
   */
  public async initAll(): Promise<any> {
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
      this.connectWallet = new ConnectWallet();
    });
  }
}
