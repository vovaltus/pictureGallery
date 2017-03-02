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
        //initialize variables
        ui.var.init();
        //initialize functions
        ui.fileStorageCheck.init();
        ui.FileSystemInit.init();
        //listener added after generate items
        //ui.listenerAdd.init();
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
                    //for persistent storage
                    //window.webkitRequestFileSystem(window.PERSISTENT, grantedBytes, ui.FileSystemInit.successCallback, ui.errorCb);

                    //for temporary storage
                    window.webkitRequestFileSystem(window.TEMPORARY, grantedBytes, ui.FileSystemInit.successCallback, ui.errorCb);
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
        console.log("There is no data file in storage, trying to read from server");
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
        var contentWrapper = document.getElementById('content-wrapper');
        var fragment = document.createDocumentFragment();
        ui.var.json.forEach(function(item, i, arr) {
            var imageWrapper = document.createElement('div'),
                down = document.createElement('div'),
                comments = document.createElement('div'),
                like = document.createElement('div'),
                dislike = document.createElement('div'),
                circle = document.createElement('div'),
                spanLike = document.createElement('span'),
                spanDislike = document.createElement('span'),
                spanComments = document.createElement('span');
            if (item.shape.localeCompare("square") === 0) {
                imageWrapper.classList.add("square", "image-wrapper");
            } else if (item.shape.localeCompare("horizontal") === 0){
                imageWrapper.classList.add("horizontal", "image-wrapper");
            } else if (item.shape.localeCompare("vertical") === 0){
                imageWrapper.classList.add("vertical", "image-wrapper");
            }
            down.classList.add('down');
            comments.classList.add('comments');
            like.classList.add('like');
            dislike.classList.add('dislike');
            circle.classList.add('circle');
            imageWrapper.style.backgroundImage = "url('" + item.url + "')";
            spanLike.innerText = item.like;
            spanDislike.innerText = item.dislike;
            spanComments.innerText = item.comments.length;
            $(like).append($(circle).clone().append(spanLike));
            $(dislike).append($(circle).clone().append(spanDislike));
            $(comments).append($(circle).append(spanComments));
            down.appendChild(comments);
            down.appendChild(like);
            down.appendChild(dislike);
            imageWrapper.appendChild(down);
            fragment.appendChild(imageWrapper);
        });

        contentWrapper.appendChild(fragment);

        ui.listenerAdd.init();

    };

    ui.Popup = function () {
        console.log("popup work");
        var e = document.getElementById('popup-view');
        if(e.style.display == 'block')
            e.style.display = 'none';
        else
            e.style.display = 'block';
    };
    
    ui.listenerAdd = {
        init: function () {
            var imageWrapperListener = document.getElementsByClassName('image-wrapper');
            for (var i = 0; i < imageWrapperListener.length; i++){
                imageWrapperListener[i].addEventListener('click', ui.Popup, false);
            };
            document.getElementById('pv-close').addEventListener('click', ui.Popup, false);
            //document.getElementById('pv-close').addEventListener('click', ui.Popup, false);
        }
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
