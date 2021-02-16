import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, Injector, NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppConfig } from './service/appconfig';
import { HttpClientModule } from '@angular/common/http';
import { ContractService } from './service/contract/contract.service';
import { CalculatePipe } from './service/calculate/calculate.pipe';

import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

import { BigNumberDirective, BigNumberFormat, BigNumberMax, BigNumberMin } from './directives/bignumber/bignumber';

export function initializeApp(injector: Injector): any {
  return () =>
    new Promise<any>((resolve: any) => {
      const contractService = injector.get(ContractService, Promise.resolve(null));
      contractService.getStaticInfo().then(() => {
        resolve(null);
      });
    });
}
@NgModule({
  declarations: [AppComponent, CalculatePipe, BigNumberFormat],
  imports: [BrowserModule, HttpClientModule, FormsModule, ReactiveFormsModule],
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
