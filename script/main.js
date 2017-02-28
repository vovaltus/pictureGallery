/**
 * Created by Admin on 19.02.2017.
 */
var Estate = Estate || {};
Estate.UI = (function () {
    var ui = {};
    ui.var = {
        // Declare variables
        init: function () {
            this.json;
            this.file;
            this.globFs = null;
            this.readError = false;
            this.requestedBytes = 1024*1024*110; // 10MB
        }
    };

    ui.init = function () {
        ui.var.init();
        //initialize functions
        ui.FileSystemInit.init();
    };

    ui.FileSystemInit = {
        init: function () {
            console.log(ui.var.requestedBytes);
            navigator.webkitPersistentStorage.requestQuota (
                ui.var.requestedBytes, function(grantedBytes) {
                    window.webkitRequestFileSystem(window.PERSISTENT, grantedBytes, ui.FileSystemInit.successCallback, ui.FileSystemInit.errorCb);

                    //for temporary storage
                    //window.webkitRequestFileSystem(window.TEMPORARY, 1024*1024*50, successCallback, errorCb);
                }, function(e) { console.log('Error', e); }
            );
        },
        successCallback: function () {
            console.log("work");
        },
        errorCb:function () {
            console.log("errorCb");
        }
    };

    ui.DetectIE = function () {
        if (navigator.userAgent.indexOf('MSIE') != -1)
            var detectIEregexp = /MSIE (\d+\.\d+);/
        else
            var detectIEregexp = /Trident.*rv[ :]*(\d+\.\d+)/

        if (detectIEregexp.test(navigator.userAgent)) {
            var ieversion = new Number(RegExp.$1)
            if (ieversion >= 12)
                $('html').addClass('ie ie12');
            else if (ieversion >= 11)
                $('html').addClass('ie ie11');
            else if (ieversion >= 10)
                $('html').addClass('ie ie10');
        }
    };

    ui.DetectTouch = function () {
        if ('ontouchstart' in window || navigator.maxTouchPoints) {
            $('html').addClass('touch-device');
        }
    };

    return ui;
}());

$(function () {
    $('html').removeClass('no-js'); /*To detect javascript*/
    Estate.UI.DetectIE();
    Estate.UI.DetectTouch();
    Estate.UI.init();
});
