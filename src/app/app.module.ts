import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, Injector, NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppConfig } from './service/appconfig';
import { HttpClientModule } from '@angular/common/http';
import { ContractService } from './service/contract/contract.service';

// import { BigNumberDirective, BigNumberFormat, BigNumberMax, BigNumberMin } from './directives/bignumber/bignumber';

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
  declarations: [AppComponent],
  imports: [BrowserModule, HttpClientModule],
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
