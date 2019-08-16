var SslPinning = require("nativescript-ssl-pinning").SslPinning;
var sslPinning = new SslPinning();

describe("greet function", function() {
    it("exists", function() {
        expect(sslPinning.greet).toBeDefined();
    });

    it("returns a string", function() {
        expect(sslPinning.greet()).toEqual("Hello, NS");
    });
});