import {
  dataObject,
  HttpsRequestOptions,
  HttpsResponse,
  HttpsSSLPinningOptions, METHODS,
  SslPinningCommon,
} from './ssl-pinning.common';
import {isDefined} from "tns-core-modules/utils/types";

interface IPeer {
  enabled: boolean;
  allowInvalidCertificates: boolean;
  validatesDomainName: boolean;
  host?: string;
  certificate?: string;
  x509Certificate?: java.security.cert.Certificate;
}

let peer: IPeer = {
  enabled: false,
  allowInvalidCertificates: false,
  validatesDomainName: true
};

export class SslPinning extends SslPinningCommon {
  private static Client: okhttp3.OkHttpClient;

  static enableSSLPinning(options: HttpsSSLPinningOptions) {
    if (peer.host && peer.certificate) {
      return;
    }
    let certificate: string;
    let inputStream: java.io.FileInputStream;
    try {
      let file = new java.io.File(options.certificate);
      inputStream = new java.io.FileInputStream(file);
      let x509Certificate = java.security.cert.CertificateFactory.getInstance('X509').generateCertificate(inputStream);
      peer.x509Certificate = x509Certificate;
      certificate = okhttp3.CertificatePinner.pin(x509Certificate);
      inputStream.close();
    } catch (error) {
      console.error('nativescript-ssl-pinning > enableSSLPinning error', error);
      return;
    }
    peer.host = options.host;
    peer.certificate = certificate;
    peer.allowInvalidCertificates = options.allowInvalidCertificates;
    peer.validatesDomainName = options.validatesDomainName;
    peer.enabled = true;
    this.initializeClient();
    console.log('nativescript-ssl-pinning > Enabled SSL pinning');
  }

  static disableSSLPinning() {
    peer.enabled = false;
    this.initializeClient();
    console.log('nativescript-ssl-pinning > Disabled SSL pinning');
  }

  static getClient() {
    if (!this.Client) {
      this.initializeClient();
    }
    return this.Client;
  }

  static initializeClient() {
    let client = new okhttp3.OkHttpClient.Builder();
    if (peer.enabled && (peer.host || peer.certificate)) {
      let spec = okhttp3.ConnectionSpec.MODERN_TLS;
      client.connectionSpecs(java.util.Collections.singletonList(spec));

      let pinner = new okhttp3.CertificatePinner.Builder();
      pinner.add(peer.host, [peer.certificate]);
      client.certificatePinner(pinner.build());

      if (!peer.allowInvalidCertificates) {
        try {
          let x509Certificate = peer.x509Certificate;
          let keyStore = java.security.KeyStore.getInstance(
            java.security.KeyStore.getDefaultType()
          );
          keyStore.load(null, null);
          keyStore.setCertificateEntry('CA', x509Certificate);
          let keyManagerFactory = javax.net.ssl.KeyManagerFactory.getInstance('X509');
          keyManagerFactory.init(keyStore, null);
          let keyManagers = keyManagerFactory.getKeyManagers();

          let trustManagerFactory = javax.net.ssl.TrustManagerFactory.getInstance(
            javax.net.ssl.TrustManagerFactory.getDefaultAlgorithm()
          );
          trustManagerFactory.init(keyStore);

          let sslContext = javax.net.ssl.SSLContext.getInstance('TLS');
          sslContext.init(keyManagers, trustManagerFactory.getTrustManagers(), new java.security.SecureRandom());
          client.sslSocketFactory(sslContext.getSocketFactory());

        } catch (error) {
          console.error('nativescript-ssl-pinning > client.allowInvalidCertificates error', error);
        }
      }

      try {
        client.hostnameVerifier(new javax.net.ssl.HostnameVerifier({
          verify: (hostname: string, session: javax.net.ssl.SSLSession): boolean => {
            let pp = session.getPeerPrincipal().getName();
            let hv = javax.net.ssl.HttpsURLConnection.getDefaultHostnameVerifier();
            const wildCardDomains = peer.host.split('.').splice(-2).join('.') === hostname.split('.').splice(-2).join('.');
            return (
              wildCardDomains ||
              hv.verify(peer.host, session) &&
              peer.host === hostname &&
              peer.host === session.getPeerHost() &&
              pp.indexOf(peer.host) !== -1
            );
          },
        }));
      } catch (error) {
        console.error('nativescript-ssl-pinning > client.validatesDomainName error', error);
      }
    }
    this.Client = client.build();
  }

  static request(opts: HttpsRequestOptions): Promise<HttpsResponse> {
    return new Promise((resolve, reject) => {
      try {
        if (!(opts.headers && opts.headers['Content-Type'])) {
          opts.headers = {};
        }
        opts.headers['Content-Type'] = <string>opts.headers['Content-Type'] || 'application/json';
        let client = this.getClient();

        let requestBuilder: okhttp3.Request.Builder = new okhttp3.Request.Builder();
        requestBuilder.url(opts.url);
        Object.keys(opts.headers).forEach(key => requestBuilder.addHeader(key, opts.headers[key] as any));

        if ((['GET', 'HEAD'].indexOf(opts.method) !== -1) || (opts.method === 'DELETE' && !isDefined(opts.body))) {
          requestBuilder[METHODS[opts.method]]();
        } else {
          // nothing but request.post(RequestBody.create(...))
          requestBuilder[METHODS[opts.method]](this.getRequestBody(opts));
        }


        // We have to allow networking on the main thread because larger responses will crash the app with an NetworkOnMainThreadException.
        // Note that it would probably be better to offload it to a Worker or (natively running) AsyncTask.
        // Also note that once set, this policy remains active until the app is killed.
        if (opts.allowLargeResponse) {
          android.os.StrictMode.setThreadPolicy(android.os.StrictMode.ThreadPolicy.LAX);
        }

        client.newCall(requestBuilder.build()).enqueue(new okhttp3.Callback({
          onResponse: (task, response) => {
            let content;
            let headers = this.getResponseHeaders(response.headers());
            let statusCode = response.code();
            if (response.isSuccessful()) {
              try {
                content = JSON.parse(response.body().string());
              } catch (e) {
              }
              resolve({content, statusCode, headers});
            }
            reject({status: statusCode, headers, statusText: response.message()});
          },
          onFailure: (task, error) => {
            reject(error);
          },
        }));
      } catch (error) {
        reject(error);
      }
    });
  }

  static getRequestBody(requestOptions: HttpsRequestOptions): okhttp3.RequestBody {
    if (this.isMultipartFormRequest(requestOptions.headers)) {
      console.log('Building Multipart req');
      const multipartBodyBuilder: okhttp3.MultipartBody.Builder = new okhttp3.MultipartBody.Builder()
        .setType(okhttp3.MultipartBody.FORM);
      (requestOptions.body.toString()).split('&')
        .forEach((keyValue: string) => {
          const [key, value] = keyValue.split('=');
          multipartBodyBuilder.addFormDataPart(key, decodeURIComponent(value));
        });
      return multipartBodyBuilder.build();
    }
    return okhttp3.RequestBody.create(
      okhttp3.MediaType.parse(<string>requestOptions.headers['Content-Type']),
      JSON.stringify(dataObject(requestOptions.body))
    );
  }

  static getResponseHeaders(headers: okhttp3.Headers) {
    const mHeaders = {};
    let i: number, len: number = headers.size();
    for (i = 0; i < len; i++) {
      let key = headers.name(i);
      headers[key] = headers.value(i);
    }
    return mHeaders;
  }
}
