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
                    window.webkitRequestFileSystem(window.PERSISTENT, grantedBytes, ui.FileSystemInit.successCallback, ui.errorCb);

                    //for temporary storage
                    //window.webkitRequestFileSystem(window.TEMPORARY, grantedBytes, ui.FileSystemInit.successCallback, ui.errorCb);
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
        console.error(e);
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
        ui.var.json.forEach(function(item) {
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
            imageWrapper.setAttribute('data-id', item.id);
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

    ui.Popup = {
        init: function () {
            console.log("popup");
            var view = document.getElementById('popup-view');
            if(view.style.display == 'block'){
                ui.Popup.hide(this, view);
            }
            else {
                ui.Popup.show(this, view);
            }
        },
        show: function (obj, view) {
            var id = obj.getAttribute('data-id'),
                $like = $("#pv-like"),
                $dislike = $("#pv-dislike");
            id = parseInt(id);
            view.style.display = 'block';
            view.setAttribute('data-id', id);
            ui.var.json.forEach(function(item) {
               if (item.id === id){
                   $(".pv-image").css("background-image", "url(" + item.url + ")");
                   $like.find('span').text(item.like);
                   $dislike.find('span').text(item.dislike);
                   if (item.ld === 1){
                       $like.addClass("pv-active");
                       $dislike.removeClass("pv-active");
                   } else if (item.ld === -1){
                       $dislike.addClass("pv-active");
                       $like.removeClass("pv-active");
                   } else {
                       $dislike.removeClass("pv-active");
                       $like.removeClass("pv-active");
                   }
                   console.log("item.ld: " + item.ld + ";");
                   ui.Popup.addComments(item);
               }
            });

            console.log(obj);
        },
        hide: function (obj, view) {
            $("#pv-dislike").removeClass("pv-active");
            $("#pv-like").removeClass("pv-active");
            document.getElementById('pvc-cnt').innerHTML = "";
            $('#pvci-name').val("");
            $('#pvci-comment').val("");
            view.style.display = 'none';

            console.log(obj);
        },
        addComments: function (obj) {
            var pvcCnt = document.getElementById('pvc-cnt');
            var fragment = document.createDocumentFragment();
            obj.comments.forEach(function (item) {
               fragment = ui.Popup.buildComment(item, fragment);
            });
            pvcCnt.appendChild(fragment);
        },
        addComment: function () {
            var pvcCnt = document.getElementById('pvc-cnt');
            var fragment = document.createDocumentFragment();
            var id = document.getElementById("popup-view");
                id = id.getAttribute("data-id");
                id = parseInt(id);
            var comment = {
              name: $("#pvci-name").val(),
              comment: $("#pvci-comment").val(),
              date: Date.now()
            };
            ui.var.json.forEach(function (item) {
               if (item.id === id){
                   ui.Popup.buildComment(comment, fragment);
                   item.comments.push(comment);
               }
            });
            pvcCnt.appendChild(fragment);
        },
        buildComment: function (item, fragment) {
            var li = document.createElement('li'),
                name = document.createElement('span'),
                time = document.createElement('span'),
                textWrapper = document.createElement('div'),
                text = document.createElement('span'),
                date = ui.Popup.dateGenerate(item.date);
            text.innerText = item.comment;
            textWrapper.classList.add("pvc-text");
            time.innerText = date;
            time.classList.add("pvc-time");
            name.innerText = "By " + item.name;
            name.classList.add("pvc-name");
            li.classList.add("pvc-item");
            textWrapper.appendChild(text);
            li.appendChild(name);
            li.appendChild(time);
            li.appendChild(textWrapper);
            fragment.appendChild(li);
            return fragment;
        },
        dateGenerate: function (timeOld) {
            var currentDate = Date.now();
                currentDate = new Date(currentDate);
            var dateOld = new Date (timeOld);
            var dayDiff = (currentDate - timeOld)/86400000;
            //console.log("currentDate: " + currentDate + "; dateOld: " + dateOld + ";");
            //var day = currentDate.getDay();

                var hours = dateOld.getHours();
                var minutes = dateOld.getMinutes();
                var ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                minutes = minutes < 10 ? '0'+minutes : minutes;
                var strTime = hours + ':' + minutes + ' ' + ampm;
                //console.log(dayDiff + " " +strTime);
                var str;
                if (dayDiff < 1){
                    str = "Today " + strTime;
                    return str;
                } else if (dayDiff > 1 && dayDiff < 2){
                    str = 1 + " day " + strTime;
                    return str;
                } else if (dayDiff > 2){
                    str = Math.floor(dayDiff) + " days ago " + strTime;
                    return str;
                }
        }
    };

    ui.PopupButtons = {
        active: function () {
            var like = document.getElementById('pv-like'),
                dislike = document.getElementById('pv-dislike'),
                 id = document.getElementById("popup-view");
                id = id.getAttribute('data-id');
                id = parseInt(id);
            if (!this.classList.contains("pv-active") && this.id.localeCompare("pv-like") === 0 && dislike.classList.contains("pv-active")) {
                ui.PopupButtons.data( 1, -1, id);
                dislike.classList.remove("pv-active");
                like.classList.add("pv-active");
            } else if (!this.classList.contains("pv-active") && this.id.localeCompare("pv-dislike") === 0 && like.classList.contains("pv-active")){
                ui.PopupButtons.data( -1, 1, id);
                like.classList.remove("pv-active");
                dislike.classList.add("pv-active");
            } else {
                if (this.classList.contains("pv-active") && this.id.localeCompare("pv-dislike") === 0) {
                    ui.PopupButtons.data( 0, -1, id);
                } else if (!this.classList.contains("pv-active") && this.id.localeCompare("pv-dislike") === 0) {
                    ui.PopupButtons.data( 0, 1, id);
                } else if (this.classList.contains("pv-active") && this.id.localeCompare("pv-like") === 0) {
                    ui.PopupButtons.data( -1, 0, id);
                } else {
                    ui.PopupButtons.data( 1, 0, id);
                }
                this.classList.toggle("pv-active");
            }
        },
        data: function (like, dislike, id) {
            //console.log("like: " + like + "; dislike: " + dislike + "; id: " + id + ";");
            ui.var.json.forEach(function(item){
                if (id === item.id){
                    item.like += like;
                    item.dislike += dislike;
                    item.ld += like - dislike;
                    $("#pv-like").find('span').text(item.like);
                    $("#pv-dislike").find('span').text(item.dislike);
                    console.log("item.ld: " + item.ld + "; item.like: " + item.like + "; item.dislike: " + item.dislike + ";");
                }
            });

        }
        //console.log(this.id);
        // $(this).toggleClass("pv-active");


    };
    ui.listenerAdd = {
        init: function () {
            var imageWrapperListener = document.getElementsByClassName('image-wrapper');
            for (var i = 0; i < imageWrapperListener.length; i++){
                imageWrapperListener[i].addEventListener('click', ui.Popup.init, false);
            }
            document.getElementById('pv-close').addEventListener('click', ui.Popup.init, false);
            document.getElementById('pv-like').addEventListener('click', ui.PopupButtons.active, false);
            document.getElementById('pv-dislike').addEventListener('click', ui.PopupButtons.active, false);
            document.getElementById('pvci-send').addEventListener('click', ui.Popup.addComment, false);
        }
    };

    ui.DetectIE = function () {
        var detectIEregexp;
        if (navigator.userAgent.indexOf('MSIE') != -1)
            detectIEregexp = /MSIE (\d+\.\d+);/;
        else
            detectIEregexp = /Trident.*rv[ :]*(\d+\.\d+)/;

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
