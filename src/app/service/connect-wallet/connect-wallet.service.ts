import { Contract } from 'web3-eth-contract';
import { Injectable } from '@angular/core';

import Web3 from 'web3';
import { MetamaskConnect } from './metamask/metamask.service';
import { WalletsConnect } from './wallet-connect/wallet-connect.service';

export interface IProvider {
  name: string;
  bridge?: {
    url: string;
    infura?: string[];
  };
  provider?: {
    infuraID?: string;
  };
  use?: string;
}

export interface INetwork {
  name: string;
  chainID: number;
}

export interface IMessageProvider {
  code: number;
  message?: {
    title?: string;
    text: string;
  };
  provider?: string;
}

export interface IContract {
  [index: string]: Contract;
}

export interface IAddContract {
  name: string;
  address: string;
  abi: Array<any>;
}

@Injectable({
  providedIn: 'root',
})
export class ConnectWallet {
  public connector: any;
  public network: INetwork;
  private availableProviders: string[] = ['MetaMask', 'WalletConnect'];
  private providerError: IMessageProvider;
  private contracts: IContract = {};
  private Web3: any;

  constructor() {}

  public connectProvider(provider: IProvider, network: INetwork): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (!this.availableProviders.includes[provider.name]) {
        this.providerError = {
          code: 2,
          message: {
            title: 'Provider Error',
            text: `Your provider doesn't exists`,
          },
        };
        reject(this.providerError);
      }

      this.network = network;

      const connectPromises = [
        this.chooseProvider(provider.name)
          .then((connector: any) => {
            console.log('connector', connector);

            this.connector = connector;
            this.connector
              .connect(provider)
              .then((connect: any) => {
                console.log('connect providerWeb3', connect);
                return connect;
              })
              .catch((err: any) => {
                console.log('connect error', err);
              });
          })
          .catch((err) => {
            console.log('chooseProvider', err);
          }),
      ];

      Promise.all(connectPromises).then((connect: any) => {
        console.log('res', connect);
        this.initializeWeb3(connect.provider === 'Web3' ? Web3.givenProvider : connect.provider);
        resolve(this.connector);
      });
    });
  }

  private async chooseProvider(name: string): Promise<any> {
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

  public getContract(name: string): Contract {
    return this.contracts[name];
  }

  public getBalance(address: string): Promise<string | number> {
    return this.Web3.eth.getBalance(address);
  }
}
