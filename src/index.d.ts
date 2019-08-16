import { HttpsRequestOptions, HttpsResponse, HttpsSSLPinningOptions, SslPinningCommon } from "./ssl-pinning.common";
export declare class SslPinning extends SslPinningCommon {
    static enableSSLPinning(options: HttpsSSLPinningOptions): void;
    static disableSSLPinning(): void;
    static request(opts: HttpsRequestOptions): Promise<HttpsResponse>;
}
