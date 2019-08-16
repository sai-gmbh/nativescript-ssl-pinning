import { Observable } from 'tns-core-modules/data/observable';
import { SslPinning } from 'nativescript-ssl-pinning';
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

  getRequest(url = 'https://httpbin.org/get', allowLargeResponse = true) {
      SslPinning.request(
        {
          url,
          method: 'GET',
          allowLargeResponse
        })
        .then(response => console.log('Https.request response', response))
        .catch(error => {
          console.error('Https.request error', error);
          // dialogs.alert(error);
        });
  }
}
