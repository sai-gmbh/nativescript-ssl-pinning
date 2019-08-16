import { Component, OnInit } from "@angular/core";
import { Item } from "./item";
import { ItemService } from "./item.service";
import {HttpClient} from "@angular/common/http";
import {SslPinning} from "nativescript-ssl-pinning";
import * as fs from "tns-core-modules/file-system";

@Component({
    selector: "ns-items",
    moduleId: module.id,
    templateUrl: "./items.component.html"
})
export class ItemsComponent implements OnInit {
    items: Array<Item>;

    // This pattern makes use of Angular’s dependency injection implementation to
    // inject an instance of the ItemService service into this class.
    // Angular knows about this service because it is included in your app’s main NgModule,
    // defined in app.module.ts.
    constructor(private itemService: ItemService, private http: HttpClient) { }

    ngOnInit(): void {
        this.items = this.itemService.getItems();
        this.enableSSLPinning();
        this.http.get('https://httpbin.org/get').subscribe(res => console.log(res))
    }

    enableSSLPinning() {
        let dir = fs.knownFolders.currentApp().getFolder('assets');
        let certificate = dir.getFile('httpbin.org.cer').path;
        SslPinning.enableSSLPinning({host: 'httpbin.org', certificate});
    }
}
