import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { AppConfig } from '../../service/appconfig';

@Component({
  selector: 'app-tx-modal',
  templateUrl: './tx-modal.component.html',
})
export class TxModalComponent {
  public ethLink: string;
  private appConfig: any;

  constructor(public dialogRef: MatDialogRef<TxModalComponent>, private config: AppConfig, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.appConfig = config.getConfig();
    this.ethLink = this.appConfig.network.name === 'mainnet' ? `https://etherscan.io/tx/${data.tx}` : `https://${this.appConfig.network.name}.etherscan.io/tx/${data.tx}`;
  }

  /**
   * Close Modal
   */
  public closeModal(): void {
    this.dialogRef.close();
  }
}
