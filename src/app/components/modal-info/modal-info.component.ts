import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-info',
  templateUrl: './modal-info.component.html',
})
export class ModalInfoComponent {
  public text: string;
  public title: string;

  constructor(public dialogRef: MatDialogRef<ModalInfoComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
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
