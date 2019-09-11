import {Headers} from 'tns-core-modules/http';

export interface HttpsSSLPinningOptions {
  host: string;
  certificate: string;
  allowInvalidCertificates?: boolean;
  validatesDomainName?: boolean;
}

export interface HttpsRequestObject {
  [key: string]: any;
}

export interface HttpsRequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
  headers?: Headers;
  params?: HttpsRequestObject | FormData;
  body?: HttpsRequestObject | FormData;
  /**
   * On Android large responses may crash the app (fi. https://httpbin.org/bytes/10000).
   * By setting this to true we allow large responses on the main thread (which this plugin currently does).
   * Note that once set to true, this policy remains active until the app is killed.
   */
  allowLargeResponse?: boolean;
}

export interface HttpsResponse {
  headers?: Headers;
  statusCode?: number;
  content?: any;
  reason?: string;
  reject?: boolean;
}

export function dataObject(data: any): any {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }
  return data || {};
}

export const METHODS = {
  'GET': 'get',
  'HEAD': 'head',
  'DELETE': 'delete',
  'POST': 'post',
  'PUT': 'put',
  'PATCH': 'patch'
};

export class SslPinningCommon {
  static isMultipartFormRequest(headers): boolean {
    return headers['Content-Type'].includes('application/x-www-form-urlencoded') || headers['Content-Type'].includes('multipart/form-data');
  }
}