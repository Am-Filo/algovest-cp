import { Component, EventEmitter, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { TransactionSuccessModalComponent } from './components/transaction/transaction-success-modal.component';
import { MetamaskErrorComponent } from './components/metamask/metamask-error.component';

import { ThemeService } from './service/theme/theme.service';
import { ContractService } from './service/contract/contract.service';
import { daysValue } from './params';
import { AppConfig } from './service/appconfig';

interface IAccount {
  address: string;
  balance?: string;
  network: {
    name: string;
    chainID: number;
  };
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public theme = 'white';
  public themeDark = false;
  public loading = true;

  public modal = false;
  public exit = false;
  public providers = [];

  public account: IAccount;
  private accoutSubscribe: any;
  public userAddress = '';
  public onChangeAccount: EventEmitter<any> = new EventEmitter();

  public contractAddress: string;
  public totalData: any;
  public stakesList: any;
  public stakingProgress = false;

  public amountValue: number | string;
  public daySelect = false;
  public daySelected = 15;
  public apySelected = 10;
  public days = daysValue;

  constructor(private themeProvider: ThemeService, private contractService: ContractService, private ngZone: NgZone, public dialog: MatDialog, public config: AppConfig) {
    this.providers = Object.keys(config.getConfig().walletConnect.providers);
    this.detectColorScheme();
    this.contractService.transactionsSubscribe().subscribe((transaction: any) => {
      if (transaction) {
        this.dialog.open(TransactionSuccessModalComponent, {
          data: { title: 'Transaction', text: 'Completed successfully ', tx: transaction.hash },
          width: '440px',
        });
      }
    });
  }

  /**
   * Conenct
   * @description Connecting to wallet connect
   * @example
   * this.connect('MetaMask');
   */
  public connect(provider: string): void {
    this.contractService.initWalletConnect(provider).then((connect: boolean) => {
      this.modal = !connect;
      console.log('connect status', connect);

      if (connect) {
        this.getAccount();
      }
    });
  }

  /**
   * Get Main Data
   * @description Get from contract a list of data.
   * @example
   * this.initData();
   */
  public initData(): void {
    this.contractService.getMainInfo().then((data) => {
      this.totalData = data;
      this.stakeList();
      this.loading = false;
      this.contractAddress = this.contractService.getStakingAddress();
    });
  }

  /**
   * Get List of Stakes
   * @description Retrive from contract a list of accout stakes.
   * @example
   * this.stakeList();
   */
  public stakeList(): void {
    this.contractService.getAccountStakes().then((res) => {
      this.stakesList = res;
    });
  }

  /**
   * Start Stake Coins
   * @description Send coins to contract stake.
   * @example
   * this.stake();
   */
  public stake(): void {
    this.stakingProgress = true;
    this.contractService
      .startStake(this.amountValue, this.daySelected)
      .then(() => {
        this.stakingProgress = false;
        this.amountValue = 0;
      })
      .catch(() => {
        this.stakingProgress = false;
      })
      .finally(() => {
        this.contractService.updateBalance();
        this.stakeList();
      });
  }

  /**
   * Unstake Coins
   * @description Toggle ustake coins from contract.
   * @example
   * this.unstake(stake);
   */
  public unstake(stake: any): void {
    stake.withdrawProgress = true;
    this.contractService
      .unstake(stake.index, stake.id)
      .then(() => {
        this.stakeList();
        stake.withdrawProgress = false;
      })
      .catch(() => {
        stake.withdrawProgress = false;
      })
      .finally(() => {
        this.contractService.updateBalance();
        stake.withdrawProgress = false;
      });
  }

  /**
   * Select Day
   * @description Clicked on dropdown list item and set day and apy.
   * @example
   * this.selectDay(day, apy);
   */
  public selectDay(day: number, apy: number): void {
    this.daySelect = false;
    this.daySelected = day;
    this.apySelected = apy;
  }

  /**
   * Get Account
   * @description Get account from contract service.
   * @example
   * this.getAccount();
   */
  private getAccount(): void {
    // subscribe on matamask account observer
    this.contractService.getAccount().then(
      (account: IAccount) => {
        this.ngZone.run(() => {
          this.onChangeAccount.emit();
          console.log('contractService', account);
          if (account && (!this.account || this.account.address !== account.address)) {
            this.subscribeAccount();
            // this.contractService.loadAccountInfo();
          }
        });
      },
      (err) => {
        console.log('getAccount app component', err);
        this.dialog.open(MetamaskErrorComponent, {
          data: err,
          width: '400px',
        });
      }
    );
  }

  /**
   * Logout
   * @description Logout from account.
   * @example
   * this.logout();
   */
  public logout(): void {
    this.modal = !this.modal;
    this.exit = false;
    this.account = undefined;
    this.totalData = {};
    this.loading = true;
    this.contractAddress = undefined;
    this.accoutSubscribe.unsubscribe();
    this.contractService.resetConnection();
  }

  /**
   * Subscribe Account
   * @description Create subscribes on change account in metamask and contract service. Also catch error from metamak on start application.
   * @example
   * this.subscribeAccount();
   */
  public subscribeAccount(): void {
    // subscribe on contract account observer
    this.accoutSubscribe = this.contractService.accountSubscribe().subscribe(
      (account: IAccount) => {
        this.account = account;
        this.updateUserAccount();
      },
      (err) => {
        this.dialog.open(MetamaskErrorComponent, {
          data: err,
          width: '400px',
        });
      }
    );
  }

  /**
   * Update User Account
   * @description Update user account data and set substr account address.
   * @example
   * this.updateUserAccount(account);
   */
  public updateUserAccount(): void {
    this.initData();
    this.userAddress = this.account.address.substr(0, 5) + '...' + this.account.address.substr(this.account.address.length - 3, this.account.address.length);
  }

  /**
   * Detect Color Schema
   * @description On start application this function will get color theme value from ThemeService and set it to id in html tag.
   * @example
   * this.detectColorScheme();
   */
  private detectColorScheme(): void {
    this.theme = this.themeProvider.getTheme();
    this.theme = 'white';
    document.documentElement.setAttribute('id', this.theme === 'dark' ? 'dark' : 'white');
    this.themeDark = this.theme === 'dark';
    this.themeProvider.subscribeTheme().subscribe((theme) => (this.theme = theme));
  }

  /**
   * Toggle Color Schema
   * @description Change color schema from html button and run detect theme function.
   * @example
   * this.toggleColorScheme();
   */
  public toggleColorScheme(): void {
    this.themeProvider.setTheme(this.theme === 'dark' ? 'white' : 'dark');
    this.detectColorScheme();
  }
}
