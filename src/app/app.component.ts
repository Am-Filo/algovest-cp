import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AppConfig } from './service/appconfig';
import { ThemeService } from './service/theme/theme.service';
import { MetamaskService } from './service/metamask/metamask.sevice';
import { NgZone } from '@angular/core';

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
  protected accountSubscriber: any;
  protected allAccountSubscribers: any;

  public daySelect = false;
  public daySelected = 15;
  public days = [10, 15, 20, 30, 40, 50];

  private metaMaskWeb3: any;
  public configApp = {
    production: false,
    network: 'ropsten',
    net: 3,
  };

  public modalOpen = false;
  public modal: ModalInterface;

  constructor(private themeProvider: ThemeService, private httpService: HttpClient, private config: AppConfig, private ngZone: NgZone) {
    this.detectColorScheme();

    this.initApp().then(() => {
      this.metaMaskWeb3 = new MetamaskService(this.config);
      this.getAccount()
        .then((res) => console.log('res', res))
        .catch((err) => {
          console.log('err', err);
          this.account = false;
          this.modal = { title: 'Metamask Error', body: err.msg, type: 'metamask', button: { one: 'Canel', two: 'Ok' } };
          this.modalOpen = true;
        });
    });
  }

  public selectDay(day: number): any {
    this.daySelect = false;
    this.daySelected = day;
  }

  public modalEvent(event: string, type: string): void {
    console.log(event, type);

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

  public subscribeAccount(): void {
    if (this.account) {
      return;
    }
    this.accountSubscriber = this.accountSubscribe().subscribe((account: any) => {
      this.ngZone.run(() => {
        // if (account && (!this.account || this.account.address !== account.address)) {

        // }
        this.account = account;
        this.updateUserAccount();
      });
    });
    this.getAccount().catch((err) => {
      this.account = false;
      this.modal = { title: 'Metamask Error', body: err.msg, type: 'metamask', button: { one: 'Canel', two: 'Ok' } };
      this.modalOpen = true;
    });
  }

  public accountSubscribe(): Observable<any> {
    const newObserver = new Observable((observer) => {
      observer.next(this.account);
      this.allAccountSubscribers.push(observer);
      return {
        unsubscribe: () => {
          this.allAccountSubscribers = this.allAccountSubscribers.filter((a) => a !== newObserver);
        },
      };
    });
    return newObserver;
  }

  private updateUserAccount(): void {
    // tslint:disable-next-line: max-line-length
    this.userAddress = this.account.address.substr(0, 5) + '...' + this.account.address.substr(this.account.address.length - 3, this.account.address.length);
  }

  public getAccount(noEnable?: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      this.metaMaskWeb3.getAccounts(noEnable).subscribe(
        (account) => {
          if (!this.account || account.address !== this.account.address) {
            this.account = account;
            this.updateUserAccount();
          }
          resolve(this.account);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  private async initApp(): Promise<any> {
    const promises = [
      this.httpService
        .get(`/assets/js/settings.json?v=${new Date().getTime()}`)
        .toPromise()
        .then((config: any) => {
          this.configApp = config ? config : this.configApp;
          this.config.setConfig(this.configApp);
          return this.config.getConfig();
        })
        .catch(() => {
          this.config.setConfig(this.configApp);
        }),
      this.httpService
        .get(`/assets/js/constants.json?v=${new Date().getTime()}`)
        .toPromise()
        .then((result) => {
          return result;
        })
        .catch((err) => {
          console.log('err constants', err);
        }),
    ];

    return Promise.all(promises).then((result) => {
      console.log(result);
    });
  }
}
