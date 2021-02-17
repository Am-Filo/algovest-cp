import { Component, EventEmitter, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { TransactionSuccessModalComponent } from './components/transaction/transaction-success-modal.component';
import { MetamaskErrorComponent } from './components/metamask/metamask-error.component';

import { ThemeService } from './service/theme/theme.service';
import { ContractService } from './service/contract/contract.service';
import { MetamaskService } from './service/metamask/metamask.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public theme = 'white';
  public themeDark = false;

  public loading = true;

  public account: any;
  public userAddress = '';
  public onChangeAccount: EventEmitter<any> = new EventEmitter();

  public amountValue: any;

  public contractAddress: string;
  public totalData: any;
  public stakeslist: any;
  public stakingProgress = false;

  public daySelect = false;
  public daySelected = 15;
  public apySelected = 10;
  public days = [
    { value: 15, apy: 10 },
    { value: 30, apy: 11 },
    { value: 45, apy: 12.1 },
    { value: 60, apy: 13.31 },
    { value: 75, apy: 14.641 },
    { value: 90, apy: 16.1051 },
    { value: 105, apy: 17.71561 },
    { value: 120, apy: 19.487171 },
    { value: 135, apy: 21.4358881 },
    { value: 150, apy: 23.57947691 },
    { value: 165, apy: 25.9354246 },
    { value: 180, apy: 28.53116706 },
  ];

  constructor(private themeProvider: ThemeService, private contractService: ContractService, private ngZone: NgZone, private metamaskService: MetamaskService, public dialog: MatDialog) {
    this.detectColorScheme();
    this.contractService
      .getAccount()
      .then(() => {
        this.subscribeAccount();
        this.contractAddress = this.contractService.getStakingAddress();
        this.contractService.transactionsSubscribe().subscribe((transaction: any) => {
          if (transaction) {
            this.dialog.open(TransactionSuccessModalComponent, {
              data: { title: 'Transaction', text: 'Completed successfully ', tx: transaction.hash },
              width: '440px',
            });
          }
        });
      })
      .catch((err) => {
        this.dialog.open(MetamaskErrorComponent, {
          data: err,
          width: '400px',
        });
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
      console.log('init', data);
      this.totalData = data;
      this.stakeList();
      this.loading = false;
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
      this.stakeslist = res;
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

  // public onChangeAmount(): any {
  //   console.log(this.amountValue);
  // }

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
   * Subscribe Account
   * @description Create subscribes on change account in metamask and contract service. Also catch error from metamak on start application.
   * @example
   * this.subscribeAccount();
   */
  public subscribeAccount(): void {
    // subscribe on matamask account observer
    this.metamaskService.getAccounts().subscribe((account) => {
      this.ngZone.run(() => {
        this.onChangeAccount.emit();
        if (account && (!this.account || this.account.address !== account.address)) {
          this.contractService.loadAccountInfo();
          this.updateUserAccount(account);
        }
      });
    });

    // subscribe on contract account observer
    this.contractService.accountSubscribe().subscribe((account) => {
      this.updateUserAccount(account);
    });

    // catch on start metamask errors
    this.contractService.getAccount().catch((err) => {
      this.dialog.open(MetamaskErrorComponent, {
        data: err,
        width: '400px',
      });
    });
  }

  /**
   * Update User Account
   * @description Update user account data and set substr account address.
   * @example
   * this.updateUserAccount(account);
   */
  private updateUserAccount(account: any): void {
    this.initData();
    this.account = account;
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
    this.themeProvider.subscribeAddress().subscribe((theme) => (this.theme = theme));
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
