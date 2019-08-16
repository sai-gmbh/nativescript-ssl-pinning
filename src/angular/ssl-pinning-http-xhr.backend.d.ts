import { HttpEvent, HttpRequest, HttpXhrBackend, XhrFactory } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NSFileSystem } from 'nativescript-angular';
import { ExcludedService } from "./excluded.service";
export declare class SslPinningHttpXhrBackend extends HttpXhrBackend {
    private nsFileSystem;
    private excludedService;
    constructor(xhrFactory: XhrFactory, nsFileSystem: NSFileSystem, excludedService: ExcludedService);
    handle(req: HttpRequest<any>): Observable<HttpEvent<any>>;
    private handleLocalFileRequest;
}
export declare function request(req: HttpRequest<any>): Observable<{}>;
export declare function mapHeaders(req: HttpRequest<any>): {
    [key: string]: string | string[];
};
