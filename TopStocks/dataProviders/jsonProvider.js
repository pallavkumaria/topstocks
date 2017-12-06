'use strict';

(function() {
    app.data.jsonProvider = {
        url: 'http://topstocks.azurewebsites.net/api/stocksbypercentage/{market}/closeprice/?days={days}&percentage={percentageChange}'
    }
}());

// START_CUSTOM_CODE_jsonProvider
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_jsonProvider