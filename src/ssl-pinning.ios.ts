import {HttpsRequestOptions, HttpsResponse, HttpsSSLPinningOptions, SslPinningCommon, dataObject} from './ssl-pinning.common';
import {isDefined, isNullOrUndefined, isObject} from "tns-core-modules/utils/types";

interface IPolicies {
    def: AFSecurityPolicy;
    secured: boolean;
    secure?: AFSecurityPolicy;
}

let policies: IPolicies = {
    def: AFSecurityPolicy.defaultPolicy(),
    secured: false,
};

policies.def.allowInvalidCertificates = true;
policies.def.validatesDomainName = false;

export class SslPinning extends SslPinningCommon {
    static enableSSLPinning(options: HttpsSSLPinningOptions) {
        if (!policies.secure) {
            policies.secure = AFSecurityPolicy.policyWithPinningMode(AFSSLPinningMode.PublicKey);
            policies.secure.allowInvalidCertificates = (isDefined(options.allowInvalidCertificates)) ? options.allowInvalidCertificates : false;
            policies.secure.validatesDomainName = (isDefined(options.validatesDomainName)) ? options.validatesDomainName : true;
            let data = NSData.dataWithContentsOfFile(options.certificate);
            policies.secure.pinnedCertificates = NSSet.setWithObject(data);
        }
        policies.secured = true;
        console.log('nativescript-ssl-pinning > Enabled SSL pinning');
    }

    static disableSSLPinning() {
        policies.secured = false;
        console.log('nativescript-ssl-pinning > Disabled SSL pinning');
    }

    static AFSuccess(resolve, task: NSURLSessionDataTask, data: NSDictionary<string, any> & NSData & NSArray<any>) {
        let content: any;
        if (data && data.class) {
            if (data.enumerateKeysAndObjectsUsingBlock || data.class().name === 'NSArray') {

                let serial = NSJSONSerialization.dataWithJSONObjectOptionsError(data, NSJSONWritingOptions.PrettyPrinted);
                content = NSString.alloc().initWithDataEncoding(serial, NSUTF8StringEncoding).toString();
            } else if (data.class().name === 'NSData') {
                content = NSString.alloc().initWithDataEncoding(data, NSASCIIStringEncoding).toString();
            } else {
                content = data;
            }
            try {
                content = JSON.parse(content);
            } catch (e) {
            }
        } else {
            content = data;
        }
        resolve({task, content});
    }

    static AFFailure(resolve, reject, task: NSURLSessionDataTask, error: NSError) {
        let data: NSData = error.userInfo.valueForKey(AFNetworkingOperationFailingURLResponseDataErrorKey);
        let body = NSString.alloc().initWithDataEncoding(data, NSUTF8StringEncoding).toString();
        try {
            body = JSON.parse(body);
        } catch (e) {
        }
        let content: any = {
            body,
            description: error.description,
            reason: error.localizedDescription,
            url: error.userInfo.objectForKey('NSErrorFailingURLKey').description
        };
        if (policies.secured === true) {
            content.description = 'nativescript-ssl-pinning > Invalid SSL certificate! ' + content.description;
        }
        let reason = error.localizedDescription;
        reject({task, content, reason});
    }

    static request(opts: HttpsRequestOptions): Promise<HttpsResponse> {
        return new Promise((resolve, reject) => {
            try {

                const manager = AFHTTPSessionManager.alloc().initWithBaseURL(NSURL.URLWithString(opts.url));

                if (opts.headers && opts.headers['Content-Type'] === 'application/json') {
                    manager.requestSerializer = AFJSONRequestSerializer.serializer();
                    manager.responseSerializer = AFJSONResponseSerializer.serializerWithReadingOptions(NSJSONReadingOptions.AllowFragments);
                } else {
                    manager.requestSerializer = AFHTTPRequestSerializer.serializer();
                    manager.responseSerializer = AFHTTPResponseSerializer.serializer();
                }
                manager.requestSerializer.allowsCellularAccess = true;
                manager.securityPolicy = (policies.secured === true) ? policies.secure : policies.def;
                manager.requestSerializer.timeoutInterval = 10;

                let heads = opts.headers;
                if (heads) {
                    Object.keys(heads).forEach(key => manager.requestSerializer.setValueForHTTPHeaderField(heads[key] as any, key));
                }

                let dict: NSMutableDictionary<string, any> = null;
                if (opts.body) {
                    let cont = dataObject(opts.body);
                    if (isObject(cont)) {
                        dict = NSMutableDictionary.new<string, any>();
                        Object.keys(cont).forEach(key => dict.setValueForKey(cont[key] as any, key));
                    }
                }

                let methods = {
                    'GET': 'GETParametersSuccessFailure',
                    'POST': 'POSTParametersSuccessFailure',
                    'PUT': 'PUTParametersSuccessFailure',
                    'DELETE': 'DELETEParametersSuccessFailure',
                    'PATCH': 'PATCHParametersSuccessFailure',
                    'HEAD': 'HEADParametersSuccessFailure',
                };
                manager[methods[opts.method]](opts.url, dict, function success(task: NSURLSessionDataTask, data: any) {
                    SslPinning.AFSuccess(resolve, task, data);
                }, function failure(task, error) {
                    SslPinning.AFFailure(resolve, reject, task, error);
                });
            } catch (error) {
                reject(error);
            }

        }).then((AFResponse: {
            task: NSURLSessionDataTask
            content: any
            reason?: string
        }) => {

            let sendi: HttpsResponse = {
                content: AFResponse.content,
                headers: {},
            };

            let response = AFResponse.task.response as NSHTTPURLResponse;
            if (!isNullOrUndefined(response)) {
                sendi.statusCode = response.statusCode;
                let dict = response.allHeaderFields;
                dict.enumerateKeysAndObjectsUsingBlock((k, v) => sendi.headers[k] = v);
            }

            if (AFResponse.reason) {
                sendi.reason = AFResponse.reason;
            }
            return Promise.resolve(sendi);

        }).catch((AFResponse: {
            task: NSURLSessionDataTask
            content: any
            reason?: string
        }) => {
            let sendi: HttpsResponse = {
                content: AFResponse.content,
                headers: {},
                reason: AFResponse.reason
            };
            let response = AFResponse.task.response as NSHTTPURLResponse;
            if (!isNullOrUndefined(response)) {
                sendi.statusCode = response.statusCode;
                let dict = response.allHeaderFields;
                dict.enumerateKeysAndObjectsUsingBlock((k, v) => sendi.headers[k] = v);
            }
            return Promise.reject(sendi);
        });
    }
}
