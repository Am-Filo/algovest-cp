import { Contract } from 'web3-eth-contract';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import Web3 from 'web3';

import { MetamaskConnect } from './metamask/metamask.service';
import { WalletsConnect } from './wallet-connect/wallet-connect.service';
import { INetwork, IMessageProvider, IContract, IProvider, IAddContract, IConnect, ISettings, IError, IConnectorMessage } from './connect-wallet.interface';
import { parameters } from './params';

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

  constructor() {}

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

  private applySettings(data): any {
    if (this.settings.providerType) {
      data.type = this.providerName;
    }
    return data;
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

  public getAccounts(): Observable<any> {
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

  public Contract = (name: string): Contract => this.contracts[name];
  public Web3Provider = () => this.Web3;
  public getBalance = (address: string): Promise<string | number> => this.Web3.eth.getBalance(address);
  public resetConect = (): void => (this.connector = undefined);
}
