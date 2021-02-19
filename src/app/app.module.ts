import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, Injector, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { AppRoutingModule } from './app-routing.module';

import { AppConfig } from './service/appconfig';
import { ContractService } from './service/contract/contract.service';
import { CalculatePipe } from './service/calculate/calculate.pipe';
import { BigNumberDirective, BigNumberFormat, BigNumberMax, BigNumberMin } from './directives/bignumber/bignumber';

import { AppComponent } from './app.component';
import { MetamaskErrorComponent } from './components/metamask/metamask-error.component';
import { TransactionSuccessModalComponent } from './components/transaction/transaction-success-modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

/**
 * Main Initialization App
 * @description When service open in browser, this function will triggered first to initialized contract and metamask service. Also add contracts abi and address to web3.
 * @example
 * providers:[{provide: APP_INITIALIZER,useFactory: initializeApp,deps: [Injector],multi: true,}]
 */
export function initializeApp(injector: Injector): any {
  return () =>
    new Promise<any>((resolve: any) => {
      const contractService = injector.get(ContractService, Promise.resolve(null));
      contractService.initAll().then(() => {
        resolve(null);
      });
    });
}
@NgModule({
  entryComponents: [TransactionSuccessModalComponent, MetamaskErrorComponent],
  declarations: [AppComponent, TransactionSuccessModalComponent, MetamaskErrorComponent, CalculatePipe, BigNumberFormat, BigNumberMax, BigNumberMin, BigNumberDirective],
  imports: [AppRoutingModule, BrowserModule, HttpClientModule, FormsModule, ReactiveFormsModule, BrowserAnimationsModule, MatDialogModule],
  providers: [
    AppConfig,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [Injector],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
