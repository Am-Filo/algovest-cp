import { MetamaskService } from './service/metamask/metamask.service';
import { Component, NgZone } from '@angular/core';
import { ThemeService } from './service/theme/theme.service';
import { ContractService } from './service/contract/contract.service';

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

  public account: any;
  public userAddress = '';
  protected accountSubscribe: any;

  public contractAddress: string;

  public daySelect = false;
  public daySelected = 15;
  public days = [10, 15, 20, 30, 40, 50];

  public modalOpen = false;
  public modal: ModalInterface;

  // tslint:disable-next-line: max-line-length
  constructor(private themeProvider: ThemeService, private contractService: ContractService, private ngZone: NgZone, protected metamaskService: MetamaskService) {
    this.detectColorScheme();
    this.contractService.getAccount().then((account: Account) => {
      console.log('account 1', account);
      this.subscribeAccount();
      this.contractAddress = this.contractService.getContractAddress();

      // this.contractService.getZeroDayStartTime().then((res: any) => {
      //   console.log('contractService getZeroDayStartTime', res);
      // });
    });
  }

  public trigger(): any {
    this.contractService.getStakingContractInfo().then((res: any) => {
      console.log('contractService getStakingContractInfo', res);
      return res;
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

  public selectDay(day: number): any {
    this.daySelect = false;
    this.daySelected = day;
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
