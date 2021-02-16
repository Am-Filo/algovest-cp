import { MetamaskService } from './service/metamask/metamask.service';
import { Component, NgZone } from '@angular/core';
import { ThemeService } from './service/theme/theme.service';
import { ContractService } from './service/contract/contract.service';
import BigNumber from 'bignumber.js';

interface ModalInterface {
  title: string;
  body: string;
  type: string;
  button: { one: string; two: string };
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

  public account: any;
  public userAddress = '';
  private accountSubscribe: any;

  public amountValue: any;

  public contractAddress: string;
  public totalData: any;

  public daySelect = false;
  public daySelected = 15;
  public apySelected = 10;
  public days = [
    { value: 15, apy: 10 },
    { value: 30, apy: 10.4 },
    { value: 45, apy: 10.8 },
    { value: 60, apy: 11.2 },
    { value: 75, apy: 11.6 },
    { value: 90, apy: 12 },
    { value: 105, apy: 12.4 },
    { value: 120, apy: 12.8 },
    { value: 135, apy: 13.2 },
    { value: 150, apy: 13.6 },
    { value: 165, apy: 14 },
    { value: 180, apy: 14.4 },
  ];

  public modalOpen = false;
  public modal: ModalInterface;

  // tslint:disable-next-line: max-line-length
  constructor(private themeProvider: ThemeService, private contractService: ContractService, private ngZone: NgZone, private metamaskService: MetamaskService) {
    this.detectColorScheme();
    this.contractService.getAccount().then((account: Account) => {
      this.subscribeAccount();
      this.contractAddress = this.contractService.getStakingAddress();
      this.contractService.getMainInfo().then((res) => {
        console.log(res);
        this.totalData = res;
        this.loading = false;
      });

      // this.contractService.getZeroDayStartTime().then((res: any) => {
      //   console.log('contractService getZeroDayStartTime', res);
      // });
    });
  }

  public subscribeAccount(): void {
    this.accountSubscribe = this.metamaskService.getAccounts().subscribe(
      (account) => {
        this.ngZone.run(() => {
          if (account && (!this.account || this.account.address !== account.address)) {
            this.contractService.loadAccountInfo();
            this.updateUserAccount(account);
          }
        });
      },
      (err) => {
        console.log('subscribeAccount', err);
        this.account = false;
        this.modal = { title: 'Metamask Error', body: err.msg, type: 'metamask', button: { one: 'Cancel', two: 'Ok' } };
        this.modalOpen = true;
      }
    );

    this.contractService.getAccount().catch((err) => {
      this.account = false;
      this.modal = { title: 'Metamask Error', body: err.msg, type: 'metamask', button: { one: 'Cancel', two: 'Ok' } };
      this.modalOpen = true;
    });
  }

  public selectDay(day: number, apy: number): any {
    this.daySelect = false;
    this.daySelected = day;
    this.apySelected = apy;
  }

  public startStake(): void {
    console.log(new BigNumber(this.amountValue).pow(18).toString());

    this.contractService.startStake('400040000000000000', this.daySelected).then((res) => {
      console.log(res);
    });
  }

  public modalEvent(event: string, type: string): void {
    switch (type) {
      case 'metamask':
        this.modalOpen = false;
        this.modal = {} as ModalInterface;
        break;
    }
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

  private updateUserAccount(account: any): void {
    this.account = account;
    // tslint:disable-next-line: max-line-length
    this.userAddress = this.account.address.substr(0, 5) + '...' + this.account.address.substr(this.account.address.length - 3, this.account.address.length);
  }
}
