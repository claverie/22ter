$(document).ready(function DomoticzW() {

    var Params = {
        temp: {
            rdc: 25,
            floor: 26,
            ext: 0
        }
    };

    var cssLoader = {
        reload: function() {
            $("[data-domo-css]").each( function() {
                var nref = $(this).attr("href").replace(/\?v=[0-9]*/,"?v="+Date.now());
                $(this).attr("href" , nref);
            });
        },
        toggle: function() {
            var $css = $("[data-domo-css-color]");
            var css = $css.attr("href");
            $log.debug("Switch CSS ["+css+"]")
            if ($css.attr("data-domo-css-color") === "light") {
                $css.attr("data-domo-css-color", "dark").attr("href", "/dist/css/domo-dark.css");
            } else {
                $css.attr("data-domo-css-color", "light").attr("href", "/dist/css/domo-light.css");
            }
        }
    };
    $(".reload-css").on("click", function() {
        cssLoader.reload();
    });
    $(".toggle-css").on("click", function() {
        cssLoader.toggle();
    });

    var myDate = function(timestamp) {
        var optionsDay = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour12: false
        };
        var optionsHour = {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false
        };
        var nD = new Date((timestamp));
        return {
            "day" : nD.toLocaleString("fr-FR", optionsDay),
            "hour" : nD.toLocaleString("fr-FR", optionsHour),
            toString: function() {
                return nD.toLocaleString("fr-FR", optionsDay)+" "+nD.toLocaleString("fr-FR", optionsHour);
            }
        };
    };

    var Forecast = {
        updateHandler: null,
        lastUpdate: null,
        datas: null,
        parameters: null,
        interval: 30* 60 * 1000,
        init: function (handler) {
            this.updateHandler = handler;
            var self = this;
            var command = 'configuration/forecast.json';
            Server.request(
                command,
                "GET",
                null,
                null,
                function(data) {
                    var tmp = JSON.parse(data);
                    self.parameters = tmp.parameters;
                    self.retrieve();
                },
                function () {
                    $log.danger("Erreur de récupération de la configration Forecast.");
                }
            );
        },
        retrieve: function() {
            var self = this;
            var now = Date.now();
            this.datas = JSON.parse(localStorage.getItem("forecast.datas"));
            this.lastUpdate = parseInt(localStorage.getItem("forecast.lastUpdate"));
            if (this.lastUpdate === null || (this.lastUpdate + this.interval) < now) {
                $log.info("Appel de Forecast.io [date : "+myDate(this.lastUpdate).toString()+"]");
                var urlE = "/" +this.parameters.key +  "/" + this.parameters.loc;
                urlE +=  "?callback=handleForecastResponse&"+ $.param(self.parameters.options);
                var retrieve = $.ajax({
                    url: this.parameters.url + urlE,
                    type: 'GET',
                    jsonp: "handleForecastResponse",
                    dataType: "jsonp",
                    xhrFields: {
                        withCredentials: true
                    }
                });
            } else {
                $log.info("Utilisation des données météo locales [date : "+myDate(this.lastUpdate).toString()+"].");
                $log.info("Météo, récupération des données dans "+self.interval/(60*1000)+" minutes.")
                setTimeout( function() {
                    self.retrieve();
                }, self.interval );
                self.updateHandler();
            }
        },
        parseResponse: function(data) {
            var self = this;
            self.lastUpdate = Date.now();
            var options = {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour12: false
            };
            console.log("Forecast.data", data);
            this.datas = data;
            for (var it=0; it<this.datas.daily.data.length; it++) {
                this.datas.daily.data[it].dateTime = myDate((this.datas.daily.data[it].time * 1000));
            }
            for (var it=0; it<this.datas.hourly.data.length; it++) {
                this.datas.hourly.data[it].dateTime = myDate((this.datas.hourly.data[it].time * 1000));
            }
            this.datas.currently.dateTime = myDate((this.datas.currently.time * 1000));
            var itab = [ $.extend({}, this.datas.currently) ];
            this.datas.currently.data = itab;

            localStorage.setItem("forecast.lastUpdate", self.lastUpdate);
            localStorage.setItem("forecast.datas", JSON.stringify(this.datas));
            self.updateHandler();
            $log.info("Météo, récupération des données dans "+self.interval/(60*1000)+" minutes.")
            setTimeout( function() {
                self.retrieve();
            }, self.interval );
        },
        getDatas: function() {
            this.datas = JSON.parse(localStorage.getItem("forecast.datas"));
        }
    };
    handleForecastResponse = function (data) {
        Forecast.parseResponse(data);
    };


    var AppGroups = {
        groups : null,
        load: function (handler) {
            var self = this;
            var command = 'configuration/groups.json';
            Server.request(
                command,
                "GET",
                null,
                null,
                function(jsonGroups) {
                    var data = JSON.parse(jsonGroups);
                    self.groups = new Array(data.groups.length); //data.groups;
                    for (var it= 0; it<data.groups.length; it++) {
                        self.groups[it] = { label: data.groups[it].label, items: [] };
                        for (var id= 0; id<data.groups[it].list.length; id++) {
                            self.groups[it].items.push( Switches.devices.byIdx[data.groups[it].list[id].idx] );
                        }
                    }
                    if (typeof handler === "function") {
                        handler();
                    }
                });
        }
    };

    var Server = {
        backendUrl: "/",
        request: function (queryString, method, xhrFields, data, doneHandler, failHandler, processData, doNotComputeContentType) {
            var self = this, request;
            processData = processData === undefined;
            doNotComputeContentType = doNotComputeContentType !== undefined;
            request =             {
                url: this.backendUrl + queryString,
                method: method,
                xhrFields: xhrFields,
                data: data,
                processData: processData
            };
            if (doNotComputeContentType)
            {
                request.contentType = false;
            }
            $.ajax(request)
                .done(function (response)
                {
                    if (typeof doneHandler === "function")
                    {
                        doneHandler(response);
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown)
                {
                    if (typeof failHandler === "function")
                    {
                        failHandler(jqXHR, textStatus, errorThrown);
                    }
                    else
                    {
                        $log.danger("Erreur d'accès au serveur [" + textStatus + "].");
                    }
                });
        }
    };

    var DomoServer = {
        init: function () {
            var newServer = Object.create(Server);
            newServer.backendUrl = "http://192.168.0.60/json.htm?";
            return newServer;
        }
    };

    var domoLog = {
        write: function(device, request, status) {
            var fullMsg = '[client ip]['+device+'] '+request+' ('+status+')';
            var command = 'type=command&param=addlogmessage&message='+fullMsg;
            DomoServer.init().request(
                command,
                "GET"
            )
        }
    };

    var DayInfos = {
        datas : {},
        init: function(data) {
            this.datas.sunrise = data.Sunrise;
            this.datas.sunset = data.Sunset;
            var dt = new Date(data.ServerTime);
            var options = {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour12: false
            };
            this.datas.today = dt.toLocaleString("fr-FR", options);
        }
    };

    var Switches = {
        devices: null, //{ blinds: [], switches:[], temperature:[] },
        sort: function(a,b) {
            if (a.Name.toLocaleLowerCase() < b.Name.toLocaleLowerCase()) return -1;
            if (a.Name.toLocaleLowerCase() > b.Name.toLocaleLowerCase()) return 1;
            return 0;
        },
        convert: function (o) {
            var self = this;
            var devices = {
                byIdx: [],
                blinds: { items: [] },
                blindsRDC: {items: [] },
                blindsETG: {items: [] },
                blindsANX: {items: [] },
                switches:[],
                sensors: [],
                others:[]
            };
            for (var prop in o) {
                if (o.hasOwnProperty(prop)) {
                    //$log.debug(o[prop].Type+" / "+o[prop].Name+"  Data="+o[prop].Data);
                    devices.byIdx[o[prop].idx] = o[prop];
                    switch(o[prop].Type) {
                        case "RFY":
                            o[prop].isBlind = true;
                            devices.blinds.items.push(o[prop]);
                            var floor = parseInt(o[prop].PlanID);
                            switch (floor) {
                                case 2:
                                    devices.blindsRDC.items.push(o[prop]);
                                    break;
                                case 3:
                                    devices.blindsETG.items.push(o[prop]);
                                    break;
                                default:
                                    devices.blindsANX.items.push(o[prop]);
                            }
                            break;
                        case "Lighting 2":
                            o[prop].isSwitch = true;
                            devices.switches.push(o[prop]);
                            break;
                        case "Temp":
                            o[prop].isSensor = true;
                            devices.sensors.push(o[prop]);
                            break;
                        default:
                            o[prop].isOther = true;
                            devices.others.push(o[prop]);
                    }
                }
            }
            devices.blinds.items.sort( function(a, b) {
                return self.sort(a,b);
            });
            devices.blindsRDC.items.sort( function(a, b) {
                return self.sort(a,b);
            });
            devices.blindsETG.items.sort( function(a, b) {
                return self.sort(a,b);
            });
            devices.blindsANX.items.sort( function(a, b) {
                return self.sort(a,b);
            });
            devices.switches.sort( function(a, b) {
                return self.sort(a,b);
            });
            devices.sensors.sort( function(a, b) {
                return self.sort(a,b);
            });
            devices.others.sort( function(a, b) {
                return self.sort(a,b);
            });
            console.log(devices);
            return devices;
        },
        load: function(handler) {
            var self = this;
            if (self.devices === null) {
                DomoServer.init().request(
                    "type=devices&used=true&order=Name",
                    "GET",
                    null,
                    null,
                    function (data) {
                        DayInfos.init(data);
                        self.devices = self.convert(data.result);
                        handler();
                    }
                )
            } else {
                handler();
            }
        },
        run: function( switchList, order ) {
            var self = this;
            if (typeof switchList != String) {
                var switchList = switchList.toString();
            }
            var idxList = switchList.split(",");

            for (var isw=0; isw<idxList.length; isw++) {
                var idx = idxList[isw];
                var o = order;
                command = "type=command&param=switchlight&idx="+idx+"&switchcmd="+o;
                $log.info(Switches.devices.byIdx[idx].Name+": envoi de la command ["+o+"]");
                DomoServer.init().request(
                    command,
                    "GET",
                    null,
                    null,
                    function(data) {
                        domoLog.write(idx, o, data.status);
                        self.lastStatus = data;
                    }
                )
            }
            return false;
        },
        showState: function() {
            var self = this;
            this.setState(this.lastStatus.status);
            setTimeout( function() {
                self.clearState();
            }, 2000);
        },
        clearState: function() {
            this.setState('--');
        },
        setState: function(state) {
            this.$domElt.find('.status').html(state);
        }
    };


    /* __________________________________________
     **
     **    UI Management
     ** __________________________________________
     */

    var UI = {
        forecastHourly : function() {
            $("#forecast-hourly").empty().html(Mustache.render(
                $("#forecast-hourly-template").html(), Forecast.datas.hourly
            ));
        },
        forecast: function() {
            this.forecastHourly();
            var skycons = new Skycons({"color": "#F00"});
            $("canvas[data-domo-icon]")
                .each( function() {
                    var self = $(this);
                    skycons.color = (function () {
                        return self.parent().css("color");
                    }());
                    skycons.add(this, $(this).data('domo-icon'));
                    skycons.play();
                });
        },
        devices: function() {
            this.displayDayDatas();
            this.displayBlinds("#blinds-rdc", Switches.devices.blindsRDC);
            this.displayBlinds("#blinds-etg", Switches.devices.blindsETG);
            this.displayBlinds("#blinds-anx", Switches.devices.blindsANX);
            this.displaySwitches();
        },
        displayDayDatas: function() {
            UI.setDomoData("sunrise", DayInfos.datas.sunrise);
            UI.setDomoData("sunset", DayInfos.datas.sunset);
            UI.setDomoData("today", DayInfos.datas.today);
            UI.setDomoData("temp.floor", Switches.devices.byIdx[Params.temp.floor].Temp, Switches.devices.byIdx[Params.temp.floor].Name);
            UI.setDomoData("temp.rdc", Switches.devices.byIdx[Params.temp.rdc].Temp, Switches.devices.byIdx[Params.temp.rdc].Name);
            UI.setDomoData("humidity.rdc", Switches.devices.byIdx[Params.temp.rdc].Humidity);
        },
        setDomoData: function(key, value, title) {
            $('[data-domo-key="'+key+'"]')
                .html(value)
                .attr("title", title || "" );
        },
        displayBlinds: function(id, blinds) {
            $(id).empty().html(Mustache.render(
                $("#blinds-template").html(), blinds
            ));
            $(".blind").each( function() {
                $(this).attr("data-blind-state", function () {
                    switch ($(this).data("blind-rfy-state")) {
                        case "Open":
                            return "open";
                            break;
                        case "Closed":
                            return "closed";
                            break;
                    };
                    return "my";
                });
            });
        },
        displaySwitches: function() {
            var self = this;
            $("#switches").empty().html(Mustache.render(
                $("#switches-template").html(), Switches.devices
            ));
            $("[data-domo-switch-state]").each( function() {
                self.setSwitch($(this));
            });
        },
        setSwitch: function( $elt ) {
            if ($elt.data("domo-switch-state") == "On") {
                $elt.children("i").removeClass("fa-toggle-off").addClass("fa-toggle-on");
            } else {
                $elt.children("i").removeClass("fa-toggle-on").addClass("fa-toggle-off");
            }
        }
    };

Forecast.init( function() {
    console.log("Forecast.datas", Forecast.datas);
    $("#forecast-current-icon").data("domo-icon", Forecast.datas.currently.icon);
    UI.setDomoData("forecast-current-temperature", Forecast.datas.currently.temperature);
    Forecast.datas.hourly.data = Forecast.datas.hourly.data.slice(0, 12);
    UI.forecast();
    return;

    $("#forecast-current").empty().html(Mustache.render(
        $("#forecast-template").html(), meteo.currently
    ));
    $("#forecast-day").empty().html(Mustache.render(
        $("#forecast-template").html(), meteo.daily
    ));
    $("#forecast-week").empty().html(Mustache.render(
        $("#forecast-template").html(), meteo.hourly
    ));
    var d = myDate(parseInt(localStorage.getItem("forecast.lastUpdate")));
    UI.setDomoData("forecast.uptime", d.day+" "+ d.hour);
});

var ws = window.screen;
if (ws.availHeight < 600 || ws.availWidth < 960) {
    alert("Screen too small "+ws.availHeight+"x"+ws.availWidth)
}

$('body').on("click", '[data-domo-action]', function() {
    Switches.run($(this).data('domo-idx'), $(this).data('domo-action'));
});
$('body').on("click", '[data-domo-switch-state]', function() {
    console.log($(this), $(this).data("domo-switch-state"));
    if ( $(this).data("domo-switch-state") == "On") {
        Switches.run($(this).data('domo-idx'), "off");
        $(this).data("domo-switch-state", "Off");
    } else {
        Switches.run($(this).data('domo-idx'), "on");
        $(this).data("domo-switch-state", "On");
    }
    UI.setSwitch($(this));
});

$log.info("L'application est chargée.");

var initScreen = function() {
    $log.debug("Loading datas...");
    $(".logo").addClass("fa fa-spin");
    $(".loading-datas").fadeIn();
    $('[data-domo-var="date"]').html(myDate(Date.now()).day);
    Switches.load( function() {
        UI.devices();
        AppGroups.load( function() {
            $("#groups").empty().html(Mustache.render(
                $("#groups-template").html(), AppGroups
            ));
            $(".loading-datas").fadeOut();
            $(".logo").removeClass("fa fa-spin");

            /*
             setTimeout(function () {
             initScreen();
             }, 630000 );
             */

        });
    });
};
initScreen();

$(".reload-page").on("click", function () {
    initScreen();
});
$(".full-screen").on("click", function () {
    toggleFullScreen();
});
var toggleFullScreen = function() {
    if (!document.fullscreenElement &&    // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
};

});