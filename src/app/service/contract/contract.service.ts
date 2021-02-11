import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import BigNumber from 'bignumber.js';
import { Contract } from 'web3-eth-contract';

import { MetamaskService } from '../web3/metamask.service';
import { AppConfig } from '../appconfig';

export const stakingMaxDays = 1820;

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private web3Service: any;

  private H2TContract: Contract;
  private Auction: Contract;

  private isActive: boolean;
  private tokensDecimals: any = {
    ETH: 18,
  };

  public account;
  private allAccountSubscribers = [];
  public settingsApp = {
    settings: {
      checkerDays: 5000,
      checkerAuctionPool: 5000,
      checkerStakingInfo: 3600000,
      checkerBPD: 3600000,

      production: false,
      network: 'ropsten',
      chainsForButtonAddToMetamask: [1, 3, 4],
      net: 3,

      time: {
        seconds: 900,
        display: 'minutes',
      },
    },
    minutes: {
      name: 'Minutes',
      shortName: 'Min',
      lowerName: 'minutes',
    },
    days: {
      name: 'Days',
      shortName: 'Days',
      lowerName: 'days',
    },
  };

  private CONTRACTS_PARAMS: any;

  public AxnTokenAddress = 'none';

  constructor(private httpService: HttpClient, private config: AppConfig) {}

  private initAll() {
    const promises = [
      this.httpService
        .get(`/assets/js/settings.json?v=${new Date().getTime()}`)
        .toPromise()
        .then((config) => {
          if (config) {
            this.settingsApp = config as any;
            this.config.setConfig(config);
          } else {
            this.config.setConfig(this.settingsApp);
          }
        })
        .catch((err) => {
          console.log('err settings', err);
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
      const IS_PRODUCTION = this.settingsApp.settings.production;
      this.CONTRACTS_PARAMS =
        result[1][
          IS_PRODUCTION ? 'mainnet' : this.settingsApp.settings.network
        ];
      this.isActive = true;
      if (this.account) {
        this.callAllAccountsSubscribers();
      }
    });
  }

  public getCoinsDecimals() {
    return this.tokensDecimals;
  }

  public addToken() {
    this.web3Service.addToken({
      address: this.CONTRACTS_PARAMS.HEX2X.ADDRESS,
      decimals: this.tokensDecimals.HEX2X,
      image:
        'https://axiondev.rocknblock.io/assets/images/icons/axion-icon.svg',
      symbol: 'AXN',
    });
  }

  private getTokensInfo(noEnable?) {
    if (!noEnable) {
      this.initializeContracts();
    }

    const promises = [
      this.H2TContract.methods
        .decimals()
        .call()
        .then((decimals) => {
          this.tokensDecimals.H2T = decimals;
        }),
    ];

    return Promise.all(promises);
  }

  public getStaticInfo() {
    return this.initAll().then(() => {
      this.web3Service = new MetamaskService(this.config);
      this.web3Service.getAccounts().subscribe((account: any) => {
        if (account) {
          this.initializeContracts();
          const promises = [this.getTokensInfo(false)];
          return Promise.all(promises);
        }
      });
    });
  }

  private callAllAccountsSubscribers() {
    if (this.isActive) {
      this.allAccountSubscribers.forEach((observer) => {
        observer.next(this.account);
      });
    }
  }

  public accountSubscribe() {
    const newObserver = new Observable((observer) => {
      observer.next(this.account);
      this.allAccountSubscribers.push(observer);
      return {
        unsubscribe: () => {
          this.allAccountSubscribers = this.allAccountSubscribers.filter(
            (a) => a !== newObserver
          );
        },
      };
    });
    return newObserver;
  }

  public updateETHBalance(callEmitter?) {
    return new Promise((resolve, reject) => {
      if (!(this.account && this.account.address)) {
        return reject();
      }
      return this.web3Service
        .getBalance(this.account.address)
        .then((balance) => {
          const bigBalance = new BigNumber(balance);
          this.account.balances = this.account.balances || {};
          this.account.balances.ETH = {
            wei: balance,
            weiBigNumber: bigBalance,
            shortBigNumber: bigBalance.div(new BigNumber(10).pow(18)),
            display: bigBalance.div(new BigNumber(10).pow(18)).toFormat(4),
          };
          resolve(true);
          if (callEmitter) {
            this.callAllAccountsSubscribers();
          }
        });
    });
  }

  public getContractsInfo() {
    const promises = [
      this.Auction.methods
        .calculateStepsFromStart()
        .call()
        .then((auctionId) => {
          return this.Auction.methods
            .reservesOf(auctionId)
            .call()
            .then((res) => {
              return {
                key: 'Auction',
                value: new BigNumber(res[1])
                  .div(Math.pow(10, this.tokensDecimals.HEX2X))
                  .toString(),
              };
            });
        }),
    ];

    return Promise.all(promises).then((results) => {
      const info = {};
      results.forEach((params) => {
        info[params.key] = params.value;
      });

      return info;
    });
  }

  private checkTx(tx, resolve, reject) {
    this.web3Service.Web3.eth
      .getTransaction(tx.transactionHash)
      .then((txInfo) => {
        if (txInfo.blockNumber) {
          resolve(tx);
        } else {
          setTimeout(() => {
            this.checkTx(tx, resolve, reject);
          }, 2000);
        }
      }, reject);
  }

  private checkTransaction(tx) {
    return new Promise((resolve, reject) => {
      this.checkTx(tx, resolve, reject);
    });
  }

  public async sendMaxETHToAuction(amount, ref?) {
    const date = Math.round(
      (new Date().getTime() + 24 * 60 * 60 * 1000) / 1000
    );
    const refLink = ref
      ? ref.toLowerCase()
      : '0x0000000000000000000000000000000000000000'.toLowerCase();

    const dataForFee = await this.web3Service.encodeFunctionCall(
      'bet',
      'function',
      [
        {
          internalType: 'uint256',
          name: 'deadline',
          type: 'uint256',
        },
        { internalType: 'address', name: 'ref', type: 'address' },
      ],
      [date, refLink]
    );

    const gasPrice = await this.web3Service.gasPrice();

    return new Promise((resolve, reject) => {
      return this.web3Service
        .estimateGas(
          this.account.address,
          this.CONTRACTS_PARAMS.Auction.ADDRESS,
          amount,
          dataForFee,
          gasPrice
        )
        .then((res) => {
          const feeRate = res;
          const newAmount = new BigNumber(amount).minus(feeRate * gasPrice);
          if (newAmount.isNegative()) {
            reject({
              msg: 'Not enough gas',
            });
            return;
          }
          return this.Auction.methods
            .bet(date, refLink)
            .send({
              from: this.account.address,
              value: newAmount,
              gasPrice,
              gasLimit: feeRate,
            })
            .then((res) => {
              return this.checkTransaction(res).then((res) => {
                resolve(res);
              });
            });
        });
    });
  }

  private initializeContracts() {
    this.H2TContract = this.web3Service.getContract(
      this.CONTRACTS_PARAMS.H2T.ABI,
      this.CONTRACTS_PARAMS.H2T.ADDRESS
    );

    this.Auction = this.web3Service.getContract(
      this.CONTRACTS_PARAMS.Auction.ABI,
      this.CONTRACTS_PARAMS.Auction.ADDRESS
    );

    this.AxnTokenAddress = this.CONTRACTS_PARAMS.HEX.ADDRESS;
  }
}
