import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-metamask-error',
  templateUrl: './metamask-error.component.html',
})
export class MetamaskErrorComponent {
  public text: string;
  public title: string;

  constructor(public dialogRef: MatDialogRef<MetamaskErrorComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.title = data.message.title;
    this.text = data.message.text;

    console.log(data);
  }

  /**
   * Close Modal
   */
  public closeModal(): void {
    this.dialogRef.close();
  }
}
