'use strict';

app.homeView = kendo.observable({
    onShow: function () { },
    afterShow: function () { }
});
app.localization.registerView('homeView');

// START_CUSTOM_CODE_homeView
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_homeView
(function (parent) {
    var dataProvider = app.data.jsonProvider,
            days = 5,
            percentageChange = 3,
            market = 'LSE',
        loadUi = function (e, data) {
            var uid = e.view.params.uid;
            if (typeof (uid) == 'undefined') {
                uid ='';
            }
                var res =null;
                for (var i = 0; i < data.result.length; i++) {
                    if(res == null)
                    {
                        res = data.result[i];
                    }
                    if(data.result[i].Id === uid)
                    {
                        res = data.result[i];
                    }
                }
                if(res != null)
                { 
                days = res.Days;
                percentageChange = res.PercentageChange;
                market = res.Market;
                homeViewModel.set('days', res.Days);
                homeViewModel.set('percentageChange', res.PercentageChange);
                homeViewModel.set('market', res.Market);
                }

            var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null,
                isListmenu = false,
                backbutton = e.view.element && e.view.element.find('header [data-role="navbar"] .backButtonWrapper'),
                dataSourceOptions = homeViewModel.get('_dataSourceOptions'),
                dataSource;

            if (param || isListmenu) {
                backbutton.show();
                backbutton.css('visibility', 'visible');
            } else {
                if (e.view.element.find('header [data-role="navbar"] [data-role="button"]').length) {
                    backbutton.hide();
                } else {
                    backbutton.css('visibility', 'hidden');
                }
            }

            // if (!homeViewModel.get('dataSource')) {
                dataSourceOptions.transport.read.url = dataProvider.url
                                                    .replace("{days}", days)
                                                    .replace("{percentageChange}", percentageChange)
                                                    .replace("{market}", market);
                dataSource = new kendo.data.DataSource(dataSourceOptions);
                homeViewModel.set('dataSource', dataSource);
            // }

            fetchFilteredData(param);
        },
        criteriaStockDatasource = function (e) {
            var criteriaStockProvider = app.data.backendServices;
            var criteriaStocks = criteriaStockProvider.data('TopStockCriteria');
            var filter = {
                'Owner': app.user.Id
            };
            criteriaStocks.get(filter)
                .then(function (data) {
                    loadUi(e, data);
                },
                function (error) {
                    console.log(JSON.stringify(error));
                });
        },
        /// start global model properties

        /// end global model properties
        fetchFilteredData = function (paramFilter, searchFilter) {
            var model = parent.get('homeViewModel'),
                dataSource;

            if (model) {
                dataSource = model.get('dataSource');
            } else {
                parent.set('homeViewModel_delayedFetch', paramFilter || null);
                return;
            }

            if (paramFilter) {
                model.set('paramFilter', paramFilter);
            } else {
                model.set('paramFilter', undefined);
            }

            if (paramFilter && searchFilter) {
                dataSource.filter({
                    logic: 'and',
                    filters: [paramFilter, searchFilter]
                });
            } else if (paramFilter || searchFilter) {
                dataSource.filter(paramFilter || searchFilter);
            } else {
                dataSource.filter({});
            }
        },

        dataSourceOptions = {
            type: 'json',
            transport: {
                read: {
                    url: dataProvider.url.replace("{days}", days).replace("{percentageChange}", percentageChange),
                    dataType: 'json'
                }
            },
            error: function (e) {

                if (e.xhr) {
                    var errorText = "";
                    try {
                        errorText = JSON.stringify(e.xhr);
                    } catch (jsonErr) {
                        errorText = e.xhr.responseText || e.xhr.statusText || 'An error has occurred!';
                    }
                    alert(errorText);
                }
            },
            schema: {
                data: '',
                model: {
                    fields: {
                        'StockName': {
                            field: 'StockName',
                            defaultValue: ''
                        },
                    },
                    icon: function () {
                        var i = 'featured';
                        return kendo.format('km-icon km-{0}', i);
                    },
                    getStockArrowSymbol: function(data) {
                    return data > 0 ? "arrow-up" : "arrow-down";
                    },
                    getStockCurrencySymbol: function() {
                        if(market =='LSE') return '£';
                        if(market =='NASDAQ') return '$';
                        if(market =='NSE' || market =='BSE') return 'INR ';                        
                    },
                }
            },
            serverFiltering: false,

            serverPaging: true,
            pageSize: 10

        },
        /// start data sources
        /// end data sources
        homeViewModel = kendo.observable({
            days: 5,
            percentageChange: 3,
            market: 'LSE',
            _dataSourceOptions: dataSourceOptions,
            fixHierarchicalData: function (data) {
                var result = {},
                    layout = {};
                $.extend(true, result, data);

                (function removeNulls(obj) {
                    var i, name,
                        names = Object.getOwnPropertyNames(obj);

                    for (i = 0; i < names.length; i++) {
                        name = names[i];

                        if (obj[name] === null) {
                            delete obj[name];
                        } else if ($.type(obj[name]) === 'object') {
                            removeNulls(obj[name]);
                        }
                    }
                })(result);

                (function fix(source, layout) {
                    var i, j, name, srcObj, ltObj, type,
                        names = Object.getOwnPropertyNames(layout);

                    if ($.type(source) !== 'object') {
                        return;
                    }

                    for (i = 0; i < names.length; i++) {
                        name = names[i];
                        srcObj = source[name];
                        ltObj = layout[name];
                        type = $.type(srcObj);

                        if (type === 'undefined' || type === 'null') {
                            source[name] = ltObj;
                        } else {
                            if (srcObj.length > 0) {
                                for (j = 0; j < srcObj.length; j++) {
                                    fix(srcObj[j], ltObj[0]);
                                }
                            } else {
                                fix(srcObj, ltObj);
                            }
                        }
                    }
                })(result, layout);

                return result;
            },
            itemClick: function (e) {
                var dataItem = e.dataItem || homeViewModel.originalItem;

                //app.mobileApp.navigate('#components/homeView/details.html?uid=' + dataItem.uid);

            },
            detailsShow: function (e) {
                var uid = e.view.params.uid,
                    dataSource = homeViewModel.get('dataSource'),
                    itemModel = dataSource.getByUid(uid);

                homeViewModel.setCurrentItemByUid(uid);

                /// start detail form show
                /// end detail form show
            },
            setCurrentItemByUid: function (uid) {
                var item = uid,
                    dataSource = homeViewModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel.StockName) {
                    itemModel.StockName = String.fromCharCode(160);
                }

                /// start detail form initialization
                /// end detail form initialization

                homeViewModel.set('originalItem', itemModel);
                homeViewModel.set('currentItem',
                    homeViewModel.fixHierarchicalData(itemModel));

                return itemModel;
            },
            linkBind: function (linkString) {
                var linkChunks = linkString.split('|');
                if (linkChunks[0].length === 0) {
                    return this.get('currentItem.' + linkChunks[1]);
                }
                return linkChunks[0] + this.get('currentItem.' + linkChunks[1]);
            },
            /// start masterDetails view model functions
            /// end masterDetails view model functions
            currentItem: {}
        });

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {

            parent.set('homeViewModel', homeViewModel);
            var param = parent.get('homeViewModel_delayedFetch');
            if (typeof param !== 'undefined') {
                parent.set('homeViewModel_delayedFetch', undefined);
                fetchFilteredData(param);
            }
        });
    } else {
        parent.set('homeViewModel', homeViewModel);
    }

    parent.set('onShow', function (e) {
        criteriaStockDatasource(e);
    });

})(app.homeView);

// START_CUSTOM_CODE_homeViewModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_homeViewModel