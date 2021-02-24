import { Contract } from 'web3-eth-contract';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import Web3 from 'web3';
import { MetamaskConnect } from './metamask/metamask.service';
import { WalletsConnect } from './wallet-connect/wallet-connect.service';
import { parameters } from './params';
import { INetwork, IMessageProvider, IContract, IProvider, IAddContract, IConnect, ISettings, IError, IConnectorMessage } from './connect-wallet.interface';

@Injectable({
  providedIn: 'root',
})
export class ConnectWallet {
  public connector: any;
  public providerName: string;
  public network: INetwork;
  private settings: ISettings;
  private availableProviders: string[] = ['MetaMask', 'WalletConnect'];
  private providerError: IMessageProvider;
  private contracts: IContract = {};
  private Web3: any;

  constructor() {}

  public async connectProvider(provider: IProvider, network: INetwork, settings?: ISettings): Promise<any> {
    this.settings = settings ? settings : { providerType: false };

    if (!this.availableProviders.includes(provider.name)) {
      // console.log('provider.name', provider.name);
      this.providerError = {
        code: 2,
        message: {
          title: 'Provider Error',
          text: `Your provider doesn't exists`,
        },
      };
      return this.providerError;
    }

    this.network = network;

    const connectPromises = [
      this.chooseProvider(provider.name)
        .then((connector: any) => {
          // console.log('connector', connector);

          this.connector = connector;
          return this.connector
            .connect(provider)
            .then((connect: IConnectorMessage) => {
              if (this.settings.providerType) {
                connect.type = this.providerName;
              }
              // console.log('connect providerWeb3', connect);
              return connect;
            })
            .catch((error: IConnectorMessage) => {
              if (this.settings.providerType) {
                error.type = this.providerName;
              }
              console.log('connect error', error);
              return error;
            });
        })
        .catch((err) => {
          console.log('chooseProvider', err);
        }),
    ];

    return Promise.all(connectPromises).then((connect: any) => {
      // console.log('connectPromises', connect[0]);
      if (connect[0].connected) {
        this.initializeWeb3(connect[0].provider === 'Web3' ? Web3.givenProvider : connect[0].provider);
      }
      return connect[0].connected;
    });
  }

  private async chooseProvider(name: string): Promise<any> {
    this.providerName = name;

    switch (name) {
      case 'MetaMask':
        return new MetamaskConnect();
      case 'WalletConnect':
        return new WalletsConnect();
    }
  }

  private initializeWeb3(provider: any): void {
    if (this.Web3) {
      this.Web3.setProvider(provider);
    } else {
      this.Web3 = new Web3(provider);
    }
  }

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

  public Contract(name: string): Contract {
    return this.contracts[name];
  }

  public getBalance(address: string): Promise<string | number> {
    return this.Web3.eth.getBalance(address);
  }

  public getAccounts(): Observable<any> {
    return new Observable((observer) => {
      this.connector.getAccounts().subscribe(
        (connectInfo: IConnect) => {
          // console.log('wallet connect get account', connectInfo);
          if (connectInfo.network.chainID !== this.network.chainID) {
            const error: IError = {
              code: 4,
              message: {
                title: 'Error',
                subtitle: 'Chain error',
                text: 'Please choose ' + parameters.chainsMap[parameters.chainIDMap[this.network.chainID]].name + ' network in your provider.',
              },
            };

            if (this.settings.providerType) {
              error.type = this.providerName;
            }

            observer.error(error);
          } else {
            observer.next(connectInfo);
          }
        },
        (error: IError) => {
          // console.log('catch error on connect wallet', error);
          if (this.settings.providerType) {
            error.type = this.providerName;
          }

          observer.error(error);
        }
      );
      return {
        unsubscribe(): any {},
      };
    });
  }
}
