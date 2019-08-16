import {NgModule} from "@angular/core";
import {SslPinningHttpXhrBackend} from "./ssl-pinning-http-xhr.backend";
import {ExcludedService} from "./excluded.service";
import {NativeScriptHttpClientModule} from "nativescript-angular/http-client";
import {HttpBackend} from "@angular/common/http";

@NgModule({
  providers: [
    ExcludedService,
    SslPinningHttpXhrBackend,
    {provide: HttpBackend, useExisting: SslPinningHttpXhrBackend},
  ],
  imports: [
    NativeScriptHttpClientModule
  ],
  exports: [
    NativeScriptHttpClientModule
  ]
})
export class NativescriptSslPinningHttpClientModule {

}