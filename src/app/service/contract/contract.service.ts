// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { HttpClient } from '@angular/common/http';

// import BigNumber from 'bignumber.js';
// import { Contract } from 'web3-eth-contract';

// import { MetamaskService } from '../metamask/metamask.sevice';
// import { AppConfig } from '../appconfig';

// @Injectable({
//   providedIn: 'root',
// })
// export class ContractService {
//   private metaMaskWeb3: any;
//   public account: any;

//   private H2TContract: Contract;

//   private isActive: boolean;
//   private tokensDecimals: any = {
//     ETH: 18,
//   };

//   private allAccountSubscribers = [];
//   public settingsApp = {
//     production: false,
//     network: 'ropsten',
//     net: 3,
//     addToMetamaskChains: [3],
//     tonkenUrl: 'https://ropsten.etherscan.io/token/',
//   };

//   private CONTRACTS_PARAMS: any;
//   public tokenAddress = 'none';

//   constructor(private httpService: HttpClient, private config: AppConfig) {}

//   public getStaticInfo(): Promise<any> {
//     return this.initAll().then(() => {
//       // this.metaMaskWeb3 = new MetamaskService(this.config);
//       this.metaMaskWeb3.getAccounts().subscribe((account: any) => {});
//     });
//   }

//   private initAll(): Promise<any> {
//     const promises = [
//       this.httpService
//         .get(`/assets/js/settings.json?v=${new Date().getTime()}`)
//         .toPromise()
//         .then((config) => {
//           if (config) {
//             this.settingsApp = config as any;
//             this.config.setConfig(config);
//           } else {
//             this.config.setConfig(this.settingsApp);
//           }
//         })
//         .catch((err) => {
//           console.log('err settings', err);
//           this.config.setConfig(this.settingsApp);
//         }),
//       this.httpService
//         .get(`/assets/js/constants.json?v=${new Date().getTime()}`)
//         .toPromise()
//         .then((result) => {
//           return result;
//         })
//         .catch((err) => {
//           console.log('err constants', err);
//         }),
//     ];

//     return Promise.all(promises).then((result) => {
//       const IS_PRODUCTION = this.settingsApp.production;
//       this.CONTRACTS_PARAMS = result[1][IS_PRODUCTION ? 'mainnet' : this.settingsApp.network];
//       this.isActive = true;
//     });
//   }

//   public getAccount(noEnable?: boolean): Promise<any> {
//     return new Promise((resolve, reject) => {
//       this.metaMaskWeb3.getAccounts(noEnable).subscribe(
//         (account) => {
//           if (!this.account || account.address !== this.account.address) {
//             this.account = account;
//           }
//           resolve(this.account);
//         },
//         (err) => {
//           this.account = false;
//           reject(err);
//         }
//       );
//     });
//   }

//   // public getCoinsDecimals(): void {
//   //   return this.tokensDecimals;
//   // }

//   // public addToken(): void {
//   //   this.metaMaskWeb3.addToken({
//   //     address: this.CONTRACTS_PARAMS.HEX2X.ADDRESS,
//   //     decimals: this.tokensDecimals.HEX2X,
//   //     image: 'https://axiondev.rocknblock.io/assets/images/icons/axion-icon.svg',
//   //     symbol: 'AXN',
//   //   });
//   // }

//   // private getTokensInfo(noEnable?: boolean): Promise<any> {
//   //   if (!noEnable) {
//   //     this.initializeContracts();
//   //   }

//   //   const promises = [
//   //     this.H2TContract.methods
//   //       .decimals()
//   //       .call()
//   //       .then((decimals: any) => {
//   //         this.tokensDecimals.H2T = decimals;
//   //       }),
//   //   ];

//   //   return Promise.all(promises);
//   // }

//   // private callAllAccountsSubscribers(): void {
//   //   if (this.isActive) {
//   //     this.allAccountSubscribers.forEach((observer) => {
//   //       observer.next(this.account);
//   //     });
//   //   }
//   // }

//   public accountSubscribe(): Observable<any> {
//     const newObserver = new Observable((observer) => {
//       observer.next(this.account);
//       this.allAccountSubscribers.push(observer);
//       return {
//         unsubscribe: () => {
//           this.allAccountSubscribers = this.allAccountSubscribers.filter((a) => a !== newObserver);
//         },
//       };
//     });
//     return newObserver;
//   }

//   // public updateETHBalance(callEmitter?): Promise<any> {
//   //   return new Promise((resolve, reject) => {
//   //     if (!(this.account && this.account.address)) {
//   //       return reject();
//   //     }
//   //     return this.metaMaskWeb3.getBalance(this.account.address).then((balance) => {
//   //       const bigBalance = new BigNumber(balance);
//   //       this.account.balances = this.account.balances || {};
//   //       this.account.balances.ETH = {
//   //         wei: balance,
//   //         weiBigNumber: bigBalance,
//   //         shortBigNumber: bigBalance.div(new BigNumber(10).pow(18)),
//   //         display: bigBalance.div(new BigNumber(10).pow(18)).toFormat(4),
//   //       };
//   //       resolve(true);
//   //       if (callEmitter) {
//   //         this.callAllAccountsSubscribers();
//   //       }
//   //     });
//   //   });
//   // }

//   // private checkTx(tx: any, resolve: any, reject: any): void {
//   //   this.metaMaskWeb3.Web3.eth.getTransaction(tx.transactionHash).then((txInfo) => {
//   //     if (txInfo.blockNumber) {
//   //       resolve(tx);
//   //     } else {
//   //       setTimeout(() => {
//   //         this.checkTx(tx, resolve, reject);
//   //       }, 2000);
//   //     }
//   //   }, reject);
//   // }

//   // private initializeContracts(): void {
//   //   this.H2TContract = this.metaMaskWeb3.getContract(this.CONTRACTS_PARAMS.H2T.ABI, this.CONTRACTS_PARAMS.H2T.ADDRESS);
//   //   this.tokenAddress = this.CONTRACTS_PARAMS.HEX.ADDRESS;
//   // }
// }
