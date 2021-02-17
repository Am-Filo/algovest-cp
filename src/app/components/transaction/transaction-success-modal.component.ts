import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { AppConfig } from '../../service/appconfig';

@Component({
  selector: 'app-transaction-success-modal',
  templateUrl: './transaction-success-modal.component.html',
})
export class TransactionSuccessModalComponent {
  public ethLink: string;
  private appConfig: any;

  constructor(public dialogRef: MatDialogRef<TransactionSuccessModalComponent>, private config: AppConfig, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.appConfig = config.getConfig();
    this.ethLink = this.appConfig.network === 'mainnet' ? `https://etherscan.io/tx/${data.tx}` : `https://${this.appConfig.network}.etherscan.io/tx/${data.tx}`;
  }
  public closeModal(): void {
    this.dialogRef.close();
  }
}
