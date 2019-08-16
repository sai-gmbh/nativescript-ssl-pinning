import { HttpRequest } from "@angular/common/http";
export declare class ExcludedService {
    private urlList;
    addURLs(domain: string): void;
    contains(needle: string): boolean;
    static isMultipartFormRequest(req: HttpRequest<any>): boolean;
    skipSSLPinning(req: HttpRequest<any>): boolean;
}
