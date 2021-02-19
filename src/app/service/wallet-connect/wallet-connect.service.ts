import { async } from '@angular/core/testing';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfig } from '../appconfig';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
// import WalletConnectProvider from '@walletconnect/web3-provider';
import { ContractService } from '../contract/contract.service';
import Web3 from 'web3';

@Injectable({
  providedIn: 'root',
})
export class WalletConnectService {
  public Web3: any;
  private connector: any;
  private provider: any;

  private appConfig: any;

  private netVersion: number;
  private net: string;

  private contractService: ContractService;

  constructor(private config: AppConfig) {
    this.appConfig = this.config.getConfig();

    this.connector = new WalletConnect({
      bridge: this.appConfig.bridge,
      qrcodeModal: QRCodeModal,
    });

    // console.log(QRCodeModal.close());

    // QRCodeModal.close();

    // this.connectWallet().then(() => {
    //   console.log('wait');
    //   if (!this.connector.connected) {
    //     this.contractService.reserWalletService();
    //   }
    // });

    this.netVersion = this.appConfig.production ? 1 : this.appConfig.net;
    this.net = this.netVersion === 1 ? 'mainnet' : this.appConfig.network;

    // this.conntectViaProvider();
  }

  // private async connectWallet(): Promise<any> {
  //   return new Promise((resolve) => {
  //     this.connector = new WalletConnect({
  //       bridge: this.appConfig.bridge,
  //       qrcodeModal: QRCodeModal,
  //     });

  //     console.log(this.connector);
  //     resolve(null);
  //   });
  // }

  /**
   * Get Balance
   * @description Get account balance from ethereum blockchain.
   * @example
   * metamaskService.getBalance(address).then((balance: string | number)=> {console.log('balance',balance)})
   * @returns Promise<string | number>
   */
  public getBalance(address: string): Promise<string | number> {
    return this.Web3.eth.getBalance(address);
  }

  // public async conntectViaProvider(): Promise<any> {
  //   //  Create WalletConnect Provider
  //   this.connector = new WalletConnectProvider({
  //     infuraId: '27e484dcd9e3efcfd25a83a78777cdf1',
  //     bridge: 'https://bridge.walletconnect.org',
  //   });

  //   await this.connector.enable();
  // }

  /**
   * Get Contract
   * @description Add contract abi and address to web3 and get access to contract methods.
   * @example
   * metamaskService.getContract(abi,address);
   */
  public getContract(abi: Array<any>, address: string): void {
    return new this.Web3.eth.Contract(abi, address);
  }

  /**
   * Get Account
   * @description Get an user account. Check if user have metamask and logged into then return account address if chain equal settings chain.
   *
   * If user don't have metamask then throw new error to setup metamask first.<br />
   * If user not logged into metamask then throw new error not authorized.<br />
   * If user matamask chain not equal settings chain then throw new error to settings current chain.<br />
   * if everything is ok return user address.
   * @example
   * metamaskService.getAccounts().subscribe((account: any)=> {console.log('account',account)});
   * @returns Observable<any>
   */
  public getAccounts(noEnable?: boolean): Observable<any> {
    const onAuth = (observer: any, address: string) => {
      console.log(Web3.givenProvider, this.provider);
      // this.Web3.setProvider(Web3.givenProvider);
      this.Web3 = new Web3(Web3.givenProvider);

      observer.next({
        address,
        network: this.net,
      });
      if (noEnable) {
        observer.complete();
      }
    };

    const onError = (observer: any, errorParams: any) => {
      observer.error(errorParams);
      if (noEnable) {
        observer.complete();
      }
    };

    return new Observable((observer) => {
      if (!this.connector.connected) {
        this.connector.createSession();
      } else {
        onAuth(observer, this.connector.accounts[0]);
      }

      console.log(this.connector.accounts[0]);

      // Subscribe to connection events
      this.connector.on('connect', (error, payload) => {
        if (error) {
          onError(observer, {
            code: 1,
            msg: 'Cant create established connect',
            title: 'Wallet Error',
          });
          throw error;
        }

        // Get provided accounts and chainId
        const { accounts, chainId } = payload.params[0];

        console.log(accounts, chainId);
        console.log(payload.params[0]);

        onAuth(observer, accounts);
      });

      this.connector.on('disconnect', (error, payload) => {
        console.log(payload, 'disconnect');

        onError(observer, {
          code: 1,
          msg: 'You disconnect your account in your wallet.',
          title: 'Wallet Error',
        });
      });

      this.connector.on('wc_sessionUpdate', (error, payload) => {
        console.log(payload, 'wc_sessionUpdate');
      });

      this.connector.on('wc_sessionRequest', (error, payload) => {
        console.log(payload, 'wc_sessionRequest');
      });

      this.connector.on('call_request', (error, payload) => {
        console.log(payload, 'call_request');
      });

      this.connector.on('session_update', (error, payload) => {
        console.log(payload, 'session_update');
      });

      this.connector.on('session_request', (error, payload) => {
        console.log(payload, 'session_request');
      });

      return {
        unsubscribe(): any {},
      };
    });
  }
}
