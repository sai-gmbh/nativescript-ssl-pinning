import {Injectable} from "@angular/core";
import {HttpRequest} from "@angular/common/http";

@Injectable()
export class ExcludedService {
  private urlList: Array<string> = [];

  addURLs(domain: string): void {
    this.urlList.push(domain);
  }

  contains(needle: string): boolean {
    return !!this.urlList.filter((url) => url === needle).length;
  }

  static isMultipartFormRequest(req: HttpRequest<any>): boolean {
    const headers = req.headers.get('Content-Type');
    return headers ? headers.includes('application/x-www-form-urlencoded') : false;
  }

  skipSSLPinning(req: HttpRequest<any>): boolean {
    return this.contains(req.url) || ExcludedService.isMultipartFormRequest(req);
  }
}