import { Contract } from 'web3-eth-contract';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import Web3 from 'web3';

import { MetamaskConnect } from './metamask/metamask.service';
import { WalletsConnect } from './wallet-connect/wallet-connect.service';
import { INetwork, IMessageProvider, IContract, IProvider, IAddContract, IConnect, ISettings, IError, IConnectorMessage } from './connect-wallet.interface';
import { parameters } from './helpers';

@Injectable({
  providedIn: 'root',
})
export class ConnectWallet {
  private connector: any;
  private providerName: string;
  private availableProviders: string[] = ['MetaMask', 'WalletConnect'];

  private network: INetwork;
  private settings: ISettings;

  private Web3: any;
  private contracts: IContract = {};
  private allTxSubscribers = [];

  constructor() {}

  /**
   * Connect Wallet Provider
   * @description Create or initialized new wallet provider with network and settings by passing it in arguments.
   * @example
   * connectWallet.connectProvider(providerWallet, networkWallet, connectSetting).then((connect) => {console.log(connect);},(error) => {console.log('connect error', error);});
   */
  public async connectProvider(provider: IProvider, network: INetwork, settings?: ISettings): Promise<any> {
    if (!this.availableProviders.includes(provider.name)) {
      return {
        code: 2,
        message: {
          title: 'Error',
          subtitle: 'Provider Error',
          text: `Your provider doesn't exists`,
        },
      } as IMessageProvider;
    }

    this.network = network;
    this.settings = settings ? settings : { providerType: false };

    const connectPromises = [
      this.chooseProvider(provider.name)
        .then((connector: any) => {
          this.connector = connector;
          return this.connector
            .connect(provider)
            .then((connect: IConnectorMessage) => {
              return this.applySettings(connect);
            })
            .catch((error: IConnectorMessage) => {
              return this.applySettings(error);
            });
        })
        .catch((err) => {
          console.log('chooseProvider', err);
        }),
    ];

    return Promise.all(connectPromises).then((connect: any) => {
      if (connect[0].connected) {
        this.initWeb3(connect[0].provider === 'Web3' ? Web3.givenProvider : connect[0].provider);
      }
      return connect[0].connected;
    });
  }

  /**
   * Choose Provider
   * @description Select available provider.
   * @example
   * connectWallet.chooseProvider('MetaMask');
   */
  private async chooseProvider(name: string): Promise<any> {
    this.providerName = name;
    switch (name) {
      case 'MetaMask':
        return new MetamaskConnect();
      case 'WalletConnect':
        return new WalletsConnect();
    }
  }

  /**
   * Initialize Web3
   * @description Set provider to web3 after use connect function.
   * @example
   * connectWallet.initWeb3(provider);
   */
  private initWeb3(provider: any): void {
    if (this.Web3) {
      this.Web3.setProvider(provider);
    } else {
      this.Web3 = new Web3(provider);
    }
  }

  /**
   * Apply Wallet Settings
   * @description Add settings parameters to connect wallet answers.
   * @example
   * connectWallet.applySettings(data);
   */
  private applySettings(data: IConnectorMessage | IError | IConnect): any {
    if (this.settings.providerType) {
      data.type = this.providerName;
    }
    return data;
  }

  /**
   * Get Account
   * @description Get account address and chain information from selected wallet provider.
   * @example
   * connectWallet.getAccounts().subscribe((account: any)=> {console.log('account',account)});
   * @returns Observable<any>
   */
  public getAccounts(): Observable<IConnect | IError> {
    return new Observable((observer) => {
      this.connector.getAccounts().subscribe(
        (connectInfo: IConnect) => {
          if (connectInfo.network.chainID !== this.network.chainID) {
            const error: IError = {
              code: 4,
              message: {
                title: 'Error',
                subtitle: 'Chain error',
                text: 'Please choose ' + parameters.chainsMap[parameters.chainIDMap[this.network.chainID]].name + ' network in your provider.',
              },
            };

            observer.error(this.applySettings(error));
          } else {
            observer.next(this.applySettings(connectInfo));
          }
        },
        (error: IError) => {
          observer.error(this.applySettings(error));
        }
      );
      return {
        unsubscribe(): any {},
      };
    });
  }

  /**
   * Transaction Subscribe
   * @description Create new Observer of transactions which will add it to allTransactionSubscribers variable and return information transaction failed or successed.
   * @example
   * connectWallet.txSubscribe().subscribe((tx) => {console.log('transacton', tx)});
   */
  public txSubscribe(): Observable<any> {
    const newObserver = new Observable((observer) => {
      this.allTxSubscribers.push(observer);
    });
    return newObserver;
  }

  /**
   * Call All Transaction Subscribers
   * @description Trigger observer subscribers if transaction complete.
   * @example
   * connectWallet.clTxSubscribers(txHash);
   */
  public clTxSubscribers(txHash: string): void {
    this.allTxSubscribers.forEach((observer) => {
      observer.next(txHash);
    });
  }

  /**
   * Get Transaction Status
   * @description Checking transaction hash in blockchain.
   * @example
   * new Promise((resolve, reject) => {connectWallet.checkTx(txHash, resolve, reject);});
   */
  private txStatus(txHash: string, resolve: any, reject: any): void {
    this.Web3.eth.getTransactionReceipt(txHash, (err: any, res: any) => {
      if (err || (res && res.blockNumber && !res.status)) {
        reject(err);
      } else if (res && res.blockNumber) {
        this.clTxSubscribers(txHash);
        resolve(res);
      } else if (!res) {
        setTimeout(() => {
          this.txStatus(txHash, resolve, reject);
        }, 2000);
      }
    });
  }

  /**
   * Check Transaction
   * @description Start checking transaction.
   * @example
   * connectWallet.txCheck(txHash);
   * @returns value from txStatus() function
   */
  public txCheck(txHash: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.txStatus(txHash, resolve, reject);
    });
  }

  /**
   * Add Contract
   * @description Add contract abi and address to web3.
   * @example
   * connectWallet.addContract(contract);
   */
  public addContract(contract: IAddContract): Promise<boolean> {
    return new Promise<any>((resolve, reject) => {
      try {
        this.contracts[contract.name] = new this.Web3.eth.Contract(contract.abi, contract.address);
        resolve(true);
      } catch (error) {
        reject(false);
      }
    });
  }

  /**
   * Get Contract
   * @description Get contract methods.
   * @example
   * connectWallet.Contract(ContractName);
   */
  public Contract = (name: string): Contract => this.contracts[name];

  /**
   * Get Web3
   * @description Get web3 methods.
   * @example
   * connectWallet.Web3Provider();
   */
  public Web3Provider = () => this.Web3;

  /**
   * Get Balance
   * @description Get account balance from ethereum blockchain.
   * @example
   * connectWallet.getBalance(address).then((balance: string)=> {console.log('balance',balance)});
   */
  public getBalance = (address: string): Promise<string | number> => this.Web3.eth.getBalance(address);

  /**
   * Reset Connect
   * @description Disconnect initialized wallet.
   * @example
   * connectWallet.resetConect();
   */
  public resetConect = (): void => (this.connector = undefined);
}
