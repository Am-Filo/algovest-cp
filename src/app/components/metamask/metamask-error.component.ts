import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-metamask-error',
  templateUrl: './metamask-error.component.html',
})
export class MetamaskErrorComponent {
  public err: string;
  public title: string;

  constructor(public dialogRef: MatDialogRef<MetamaskErrorComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.err = data.msg;
    this.title = data.title;
  }

  /**
   * Close Modal
   */
  public closeModal(): void {
    this.dialogRef.close();
  }
}
