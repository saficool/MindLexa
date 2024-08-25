import { Injectable } from '@angular/core';
import * as htmlToImage from 'html-to-image';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) { }

  public htmlToImageCopy(div_element: HTMLElement) {
    htmlToImage.toBlob(div_element)
      .then((blob) => {
        if (blob) {
          const clipboardItemInput = new ClipboardItem({ "image/png": blob });
          (navigator.clipboard as any).write([clipboardItemInput]);
          this.toastr.success('Graph copied to clipboard!', 'Success');
        }
      })
      .catch((error) => {
        console.error('oops, something went wrong!', error);
      });
  }
}
