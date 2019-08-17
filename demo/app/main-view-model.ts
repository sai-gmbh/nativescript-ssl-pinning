import {Observable} from 'tns-core-modules/data/observable';
import {SslPinning} from 'nativescript-ssl-pinning';
import * as fs from 'tns-core-modules/file-system';

export class HelloWorldModel extends Observable {
  public message: string;

  constructor() {
    super();
    this.enableSSLPinning();
    this.getRequest();
  }

  enableSSLPinning() {
    let dir = fs.knownFolders.currentApp().getFolder('assets');
    let certificate = dir.getFile('httpbin.org.cer').path;
    SslPinning.enableSSLPinning({host: 'httpbin.org', certificate});
  }

  getRequest(url = 'https://httpbin.org/post', allowLargeResponse = true) {
    const formData = new FormData();
    formData.append('hello', 'world');
    formData.append('hello', 'world1');
    SslPinning.request(
      {
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
        allowLargeResponse
      })
      .then(response => console.log('SSLPinning.request response', response))
      .catch(error => {
        console.error('SSLPinning.request error', error);
        // dialogs.alert(error);
      });
  }
}
