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
        ui.fileStorageCheck.init();
        ui.FileSystemInit.init();
    };

    ui.fileStorageCheck = {
        init: function () {
            if (window.File && window.FileReader && window.FileList && window.Blob) {
                console.log("File storage is available")
            } else {
                alert('The File APIs are not fully supported in this browser.');
            }
        }
    };

    ui.FileSystemInit = {
        init: function () {
            navigator.webkitPersistentStorage.requestQuota (
                ui.var.requestedBytes, function(grantedBytes) {
                    window.webkitRequestFileSystem(window.PERSISTENT, grantedBytes, ui.FileSystemInit.successCallback, ui.errorCb);

                    //for temporary storage
                    //window.webkitRequestFileSystem(window.TEMPORARY, 1024*1024*50, successCallback, errorCb);
                }, function(e) { console.log('Error', e); }
            );
        },
        successCallback: function (fs) {
            ui.var.globFs = fs;
            ui.readFromFile("data.json");
        }
    };

    ui.readFromFile = function (fileName) {
        ui.var.globFs.root.getFile(fileName, {}, function(fileEntry) {
            fileEntry.file(function(file) {
                var reader = new FileReader();
                reader.onloadend = function(e) {
                    if (fileName == 'data.json'){
                        ui.callbackFromStorage(JSON.parse(this.result));
                    }
                    else {
                        //callback3(fileEntry.toURL());
                    }
                };
                reader.readAsText(file);
            }, ui.errorCb);
        }, ui.errorRead)
    };
    
    ui.readJsonFromServer = function () {
        var json;
        var xml = new XMLHttpRequest();
        xml.open('get', 'data/data.json', true);
        xml.send();
        xml.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                try {
                    json = JSON.parse(this.responseText);
                } catch (e) {
                }
                ui.callbackFromServer(json);
                //return json2;
            }
        }    
    };

    ui.errorCb = function (e) {
        console.error(e);
    };

    ui.errorRead = function (e) {
        //console.error(e);
        console.log("There no data file in storage, trying to read from server");
        ui.readJsonFromServer();
    };
    
    ui.callbackFromServer = function (json) {
        ui.var.json = json;
        console.log("read file from server");
        ui.generateItems();
    };

    ui.callbackFromStorage = function (json) {
        ui.var.json = json;
        console.log("read file from storage");
        ui.generateItems();
    };

    ui.generateItems = function (){
        console.log("generate");
        /*
        var ul = document.getElementById('thumbs');
        var fragment = document.createDocumentFragment();
        ui.var.json.forEach(function(item, i, arr) {
            var mwsiLi = document.createElement('li'),
                mwsilLink = document.createElement('a'),
                mwsillImage = document.createElement('div');
            mwsiLi.classList.add('mwsi-li');
            mwsilLink.classList.add('mwsil-link');
            mwsilLink.href = item.url;
            mwsilLink.title = item.title;
            mwsillImage.classList.add('mwsill-image');
            mwsillImage.style.backgroundImage = "url('" + item.url + "')";
            if (i == arr.length - 1){
                mwsillImage.classList.add('selected');
                showThumbnail(mwsilLink.href, mwsilLink.title);
                document.getElementById("content").textContent = mwsilLink.title;
            }
            mwsilLink.appendChild(mwsillImage);
            mwsiLi.appendChild(mwsilLink);
            fragment.appendChild(mwsiLi);
        });

        ul.appendChild(fragment);
        */
    };

    ui.DetectIE = function () {
        if (navigator.userAgent.indexOf('MSIE') != -1)
            var detectIEregexp = /MSIE (\d+\.\d+);/;
        else
            var detectIEregexp = /Trident.*rv[ :]*(\d+\.\d+)/;

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
