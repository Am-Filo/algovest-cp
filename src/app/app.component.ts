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
  private accountSubscribe: any;
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

  public initData(): void {
    this.contractService.getMainInfo().then((data) => {
      console.log('data init', data);
      this.totalData = data;
      this.stakeList();
      this.loading = false;
    });
  }

  public stakeList(): void {
    this.contractService.getAccountStakes().then((res) => {
      this.stakeslist = res;
      console.log('user stakeslist', this.stakeslist);
    });
  }

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
      .finally(() => this.stakeList());
  }

  public unstake(stake: any): any {
    stake.withdrawProgress = true;

    this.contractService
      .unstake(stake.index, stake.id)
      .then((res) => {
        console.log('unstake', res);
        this.stakeList();
        stake.withdrawProgress = false;
      })
      .catch(() => {
        stake.withdrawProgress = false;
      });
  }

  public onChangeAmount(): any {
    console.log(this.amountValue);
  }

  public selectDay(day: number, apy: number): any {
    this.daySelect = false;
    this.daySelected = day;
    this.apySelected = apy;
  }

  public subscribeAccount(): void {
    this.accountSubscribe = this.metamaskService.getAccounts().subscribe((account) => {
      this.ngZone.run(() => {
        this.onChangeAccount.emit();
        if (account && (!this.account || this.account.address !== account.address)) {
          this.contractService.loadAccountInfo();
          this.updateUserAccount(account);
        }
      });
    });

    this.contractService.getAccount().catch((err) => {
      this.dialog.open(MetamaskErrorComponent, {
        data: err,
        width: '400px',
      });
    });
  }

  private updateUserAccount(account: any): void {
    this.initData();
    this.account = account;
    this.userAddress = this.account.address.substr(0, 5) + '...' + this.account.address.substr(this.account.address.length - 3, this.account.address.length);
  }

  private detectColorScheme(): any {
    this.theme = this.themeProvider.getTheme();
    document.documentElement.setAttribute('id', this.theme === 'dark' ? 'dark' : 'white');
    this.themeDark = this.theme === 'dark';

    this.themeProvider.subscribeAddress().subscribe((theme) => (this.theme = theme));
  }

  public toggleColorScheme(): any {
    this.themeProvider.setTheme(this.theme === 'dark' ? 'white' : 'dark');
  }
}
