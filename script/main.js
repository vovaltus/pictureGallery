/**
 * Created by Admin on 19.02.2017.
 */
"use strict";
var Gallery = Gallery || {};
Gallery.UI = function () {
    var ui = {};
    ui.var = {
        // Declare variables
        init: function () {
            this.json = [];
            this.globFs = null;
            this.typeFs = window.TEMPORARY;
            this.requestedBytes = 1024 * 1024 * 110; // 120MB
            this.writing = false;
            this.queueWrite = false;
            this.resizeAdded = false;
        }
    };

    ui.init = function () {
        //initialize variables
        ui.var.init();
        //initialize functions
        ui.FileSystemInit.init();
        ui.listenerAdd.init();
    };

    ui.FileSystemInit = {
        init: function () {
            window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
            window.storageInfo = window.storageInfo || navigator.webkitPersistentStorage;
            try {
                window.storageInfo.requestQuota(
                    ui.var.requestedBytes, function (gb) {
                        window.requestFileSystem(ui.var.typeFs, gb, ui.FileSystemInit.successCallback, ui.errorFs);
                    }, ui.errorFs);
            } catch (e) {
                ui.errorFs(e);
            }
        },
        successCallback: function (fs) {
            ui.var.globFs = fs;
            ui.readFromFileStorage("data.json");
        }

    };

    ui.readFromFileStorage = function (fileName) {
        ui.var.globFs.root.getFile(fileName, {}, function (fileEntry) {
            fileEntry.file(function (file) {
                var reader = new FileReader();
                reader.onloadend = function (e) {
                    ui.callbackFromFileStorage(JSON.parse(this.result));
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
                //return json;
            }
        }
    };

    ui.readFile = function () {
        var file = this.files[0];
        if (ui.var.globFs === null && file) {
            var FR = new FileReader();

            FR.addEventListener("load", function (e) {
                ui.newData.calculateShape(e.target.result);
            });

            FR.readAsDataURL(file);
        } else {
            ui.writeFile(file, file.name)
        }

    };

    ui.newData = {
        calculateShape: function (img) {
            var newImg = new Image(),
                aspect;
            newImg.src = img;
            newImg.onload = function () {
                aspect = newImg.width / newImg.height;
                if (aspect > 1.5) {
                    ui.newData.addData(img, "horizontal");
                } else if (aspect < 0.6) {
                    ui.newData.addData(img, "vertical");
                } else {
                    ui.newData.addData(img, "square");
                }
            };
        },
        addData: function (img, shape) {
            var newPicture = {
                id: ui.var.json.length + 1,
                url: img,
                shape: shape,
                like: 0,
                dislike: 0,
                ld: 0,
                comments: []
            };
            ui.var.json.push(newPicture);
            ui.callbackReadFile();
            if (ui.var.globFs !== null) {
                //save json to file storage
                ui.writeFile(ui.var.json, "data.json")
            }
        }
    };

    ui.writeFile = function (object, fileName) {
        if (ui.var.writing === true) {
            ui.var.queueWrite = true;
            console.log("writing now");
            return;
        }
        ui.var.writing = true;
        if (fileName.localeCompare("data.json") !== 0) {
            fileName = ui.var.json.length + "-" + fileName;
        }
        ui.var.globFs.root.getFile(fileName, {create: true}, function (fileEntry) {
            fileEntry.createWriter(function (fileWriter) {

                fileWriter.seek(0);

                if (fileName.localeCompare("data.json") === 0) {
                    var b = new Blob([JSON.stringify(object)], {type: "text/plain"});
                    fileWriter.write(b);
                } else {
                    fileWriter.write(object);
                }

                fileWriter.onwriteend = function (e) {
                    if (fileName.localeCompare("data.json") === 0) {
                        if (ui.var.queueWrite === true) {
                            ui.writeFile(ui.var.json, "data.json");
                            ui.var.queueWrite = false;
                            console.log("writing from queue")
                        }
                    } else {
                        ui.newData.calculateShape(fileEntry.toURL());
                    }
                    ui.var.writing = false;
                };

                fileWriter.onerror = function (e) {
                    console.log("Write failed: " + e.toString());
                };
            }, ui.errorCb);
        }, ui.errorCb);
    };

    ui.errorFs = function (e) {
        console.log("error initialise file system load data from JS");
        ui.loadData.init();
        ui.generateItems();
    };

    ui.errorCb = function (e) {
        console.error(e);
    };

    ui.errorRead = function (e) {
        console.log("There is no data file in storage, trying to read from server");
        ui.readJsonFromServer();
    };

    ui.callbackFromServer = function (json) {
        ui.var.json = json;
        console.log("read file from server");
        ui.generateItems();
    };

    ui.callbackFromFileStorage = function (json) {
        ui.var.json = json;
        console.log("read file from storage");
        ui.generateItems();
    };

    ui.callbackReadFile = function () {
        $("#content-wrapper").remove();
        ui.generateItems();
    };

    ui.generateItems = function () {
        var contentWrapper = document.createElement("div"),
            fragment = document.createDocumentFragment(),
            $mainWrapper = $(".main-wrapper");
        contentWrapper.id = "content-wrapper";

        ui.var.json.forEach(function (item) {
            ui.generateItem(item, contentWrapper);
        });
        ui.generateItemAddPicture(contentWrapper);
        fragment.appendChild(contentWrapper);
        $mainWrapper.append(fragment);
        ui.listenerAdd.afterGenerateItem();
        ui.centerInBrowser.init();
        ui.isotope.init();
        $mainWrapper.scrollLeft($(contentWrapper).width() - $mainWrapper.width());
    };

    ui.generateItem = function (item, wrapper) {
        var imageWrapper = document.createElement("div"),
            down = document.createElement("div"),
            comments = document.createElement("div"),
            like = document.createElement("div"),
            dislike = document.createElement("div"),
            circle = document.createElement("div"),
            spanLike = document.createElement("span"),
            spanDislike = document.createElement("span"),
            spanComments = document.createElement("span");
        down.classList.add("down");
        comments.classList.add("comments");
        like.classList.add("like");
        dislike.classList.add("dislike");
        circle.classList.add("circle");
        imageWrapper.classList.add(item.shape, "image-wrapper");
        imageWrapper.style.backgroundImage = "url(" + item.url + ")";
        imageWrapper.setAttribute("data-id", item.id);
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
        wrapper.appendChild(imageWrapper)
    };

    ui.generateItemAddPicture = function (wrapper) {
        var addWrapper = document.createElement("div"),
            input = document.createElement("INPUT"),
            label = document.createElement("label"),
            afCircle = document.createElement("span"),
            image = document.createElement("img"),
            span = document.createElement("span");
        addWrapper.classList.add("square", "add-file-wrapper", "image-wrapper");
        addWrapper.setAttribute("data-id", 99999);
        input.type = "file";
        input.id = "files";
        input.name = "files";
        label.htmlFor = "files";
        label.classList.add("af-label");
        image.classList.add("af-img");
        image.src = "images/white_cross.png";
        afCircle.classList.add("af-circle");
        span.classList.add("af-span");
        span.innerHTML = "Add your<br>Picture";
        afCircle.appendChild(image);
        label.appendChild(afCircle);
        label.appendChild(span);
        addWrapper.appendChild(input);
        addWrapper.appendChild(label);
        wrapper.appendChild(addWrapper);
    };

    ui.Popup = {
        init: function () {
            var view = document.getElementById("popup-view");
            if (view.style.display == "block") {
                ui.Popup.hide(this, view);
            }
            else {
                ui.Popup.show(this, view);
            }
        },
        show: function (obj, view) {
            var id = obj.getAttribute("data-id"),
                $like = $("#pv-like"),
                $dislike = $("#pv-dislike"),
                $quantityComments = $(".pv-quantity-comments");
            id = parseInt(id);
            view.style.display = "block";
            view.setAttribute("data-id", id);

            ui.var.json.forEach(function (item) {
                if (item.id === id) {
                    $(".pv-image").css("background-image", "url(" + item.url + ")");
                    $like.find("span").text(item.like);
                    $dislike.find("span").text(item.dislike);
                    $quantityComments.text("Comments: " + item.comments.length);
                    if (item.ld === 1) {
                        $like.addClass("pv-active");
                        $dislike.removeClass("pv-active");
                    } else if (item.ld === -1) {
                        $dislike.addClass("pv-active");
                        $like.removeClass("pv-active");
                    } else {
                        $dislike.removeClass("pv-active");
                        $like.removeClass("pv-active");
                    }
                    ui.Popup.addComments(item);
                }
            });
            $("body").css("overflow", "hidden");
        },
        hide: function (obj, view) {
            $("#pv-dislike").removeClass("pv-active");
            $("#pv-like").removeClass("pv-active");
            document.getElementById("pvc-cnt").innerHTML = "";
            $("#pvci-name").val("");
            $("#pvci-comment").val("");
            view.style.display = "none";
            $("body").css("overflow", "visible");
        },
        addComments: function (obj) {
            var pvcCnt = document.getElementById("pvc-cnt"),
                fragment = document.createDocumentFragment();
            obj.comments.forEach(function (item) {
                fragment = ui.Popup.buildComment(item, fragment);
            });
            pvcCnt.appendChild(fragment);
            //save json to file storage
            if (ui.var.globFs !== null) {
                ui.writeFile(ui.var.json, "data.json")
            }
        },
        addComment: function () {
            var pvcCnt = document.getElementById("pvc-cnt"),
                fragment = document.createDocumentFragment(),
                id = document.getElementById("popup-view").getAttribute("data-id"),
                $quantityComments = $(".pv-quantity-comments"),
                name = $("#pvci-name").val(),
                $comment = $("#pvci-comment"),
                commentText = $comment.val(),
            id = parseInt(id);
            if (!name.replace(/\s/g, "").length) {
                name = "Anonymous";
            }
            if (!commentText.replace(/\s/g, "").length) {
                return;
            }
            var comment = {
                name: name,
                comment: commentText,
                date: Date.now()
            };
            ui.var.json.forEach(function (item) {
                if (item.id === id) {
                    ui.Popup.buildComment(comment, fragment);
                    item.comments.push(comment);
                    $quantityComments.text("Comments: " + item.comments.length);
                }
            });
            $(pvcCnt).prepend(fragment);
            $comment.val("");
            $comment.focus();
            ui.updateData();
            //save json to file storage
            if (ui.var.globFs !== null) {
                ui.writeFile(ui.var.json, "data.json");
            }
        },
        buildComment: function (item, fragment) {
            var li = document.createElement("li"),
                name = document.createElement("span"),
                time = document.createElement("span"),
                textWrapper = document.createElement("div"),
                text = document.createElement("span"),
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
            $(fragment).prepend(li);

            return fragment;
        },
        dateGenerate: function (timeOld) {
            var currentDate = Date.now();
            currentDate = new Date(currentDate);
            var dateOld = new Date(timeOld),
                dayDiff = (currentDate - timeOld) / 86400000,
                hours = dateOld.getHours(),
                minutes = dateOld.getMinutes(),
                ampm = hours >= 12 ? "PM" : "AM",
                str;
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour "0" should be "12"
            minutes = minutes < 10 ? "0" + minutes : minutes;
            var strTime = hours + ":" + minutes + " " + ampm;

            if (dayDiff < 1) {
                str = "Today " + strTime;
                return str;
            } else if (dayDiff > 1 && dayDiff < 2) {
                str = 1 + " day " + strTime;
                return str;
            } else if (dayDiff > 2) {
                str = Math.floor(dayDiff) + " days ago " + strTime;
                return str;
            }
        }
    };

    ui.PopupButtons = {
        active: function () {
            var like = document.getElementById("pv-like"),
                dislike = document.getElementById("pv-dislike"),
                id = document.getElementById("popup-view").getAttribute("data-id");
            id = parseInt(id);
            if (!this.classList.contains("pv-active") && this.id.localeCompare("pv-like") === 0 && dislike.classList.contains("pv-active")) {
                ui.PopupButtons.data(1, -1, id);
                dislike.classList.remove("pv-active");
                like.classList.add("pv-active");
            } else if (!this.classList.contains("pv-active") && this.id.localeCompare("pv-dislike") === 0 && like.classList.contains("pv-active")) {
                ui.PopupButtons.data(-1, 1, id);
                like.classList.remove("pv-active");
                dislike.classList.add("pv-active");
            } else {
                if (this.classList.contains("pv-active") && this.id.localeCompare("pv-dislike") === 0) {
                    ui.PopupButtons.data(0, -1, id);
                } else if (!this.classList.contains("pv-active") && this.id.localeCompare("pv-dislike") === 0) {
                    ui.PopupButtons.data(0, 1, id);
                } else if (this.classList.contains("pv-active") && this.id.localeCompare("pv-like") === 0) {
                    ui.PopupButtons.data(-1, 0, id);
                } else {
                    ui.PopupButtons.data(1, 0, id);
                }
                this.classList.toggle("pv-active");
            }
            //save json to file storage
            if (ui.var.globFs !== null) {
                ui.writeFile(ui.var.json, "data.json");
            }
            ui.updateData();
        },
        data: function (like, dislike, id) {
            ui.var.json.forEach(function (item) {
                if (id === item.id) {
                    item.like += like;
                    item.dislike += dislike;
                    item.ld += like - dislike;
                    $("#pv-like").find("span").text(item.like);
                    $("#pv-dislike").find("span").text(item.dislike);
                }
            });

        }
    };

    ui.updateData = function () {
        var image = document.getElementsByClassName("image-wrapper");
        for (var i = 0; i < image.length; i++) {
            var id = image[i].getAttribute("data-id");
            id = parseInt(id);
            ui.var.json.forEach(function (itemJson) {
                if (id === itemJson.id) {
                    $(image[i]).find(".comments span").text(itemJson.comments.length);
                    $(image[i]).find(".like span").text(itemJson.like);
                    $(image[i]).find(".dislike span").text(itemJson.dislike);
                }
            });
        }
    };

    ui.listenerAdd = {
        init: function () {
            document.getElementById("pv-close").addEventListener("click", ui.Popup.init, false);
            document.getElementById("pv-like").addEventListener("click", ui.PopupButtons.active, false);
            document.getElementById("pv-dislike").addEventListener("click", ui.PopupButtons.active, false);
            document.getElementById("pvci-send").addEventListener("click", ui.Popup.addComment, false);
        },
        afterGenerateItem: function () {
            var imageWrapperListener = document.getElementsByClassName("image-wrapper");
            for (var i = 0; i < imageWrapperListener.length; i++) {
                if (!$(imageWrapperListener[i]).hasClass("add-file-wrapper")) {
                    imageWrapperListener[i].addEventListener("click", ui.Popup.init, false);
                }
            }
            ui.resize.init();
            document.getElementById("files").addEventListener("change", ui.readFile, false);
        }
    };

    ui.loadData = {
        init: function () {
            ui.var.json = [
                {
                    id: 6, url: "images/2.jpg", shape: "vertical", like: 10, dislike: 5, ld: 0, comments: [
                    {name: "jorj", comment: "cool", date: 1488811539662}, {
                        name: "mike",
                        comment: "best",
                        date: 1488811539662
                    }, {name: "zelly", comment: "wow", date: 1488811539662}
                ]
                },
                {
                    id: 1, url: "images/1.jpg", shape: "horizontal", like: 10, dislike: 5, ld: 1, comments: [
                    {name: "jorj", comment: "cool", date: 1488811539662}, {
                        name: "mike",
                        comment: "best",
                        date: 1488811539662
                    }, {name: "zelly", comment: "wow", date: 1488811539662}
                ]
                },
                {
                    id: 2, url: "images/3.jpg", shape: "square", like: 10, dislike: 5, ld: 0, comments: [
                    {name: "jorj", comment: "cool", date: 1488811539662}, {
                        name: "mike",
                        comment: "best",
                        date: 1488811539662
                    }, {name: "zelly", comment: "wow", date: 1488811539662}
                ]
                },
                {
                    id: 7, url: "images/5.jpg", shape: "square", like: 10, dislike: 5, ld: 0, comments: [
                    {name: "jorj", comment: "cool", date: 1488811539662}, {
                        name: "mike",
                        comment: "best",
                        date: 1488811539662
                    }, {name: "zelly", comment: "wow", date: 1488811539662}
                ]
                },
                {
                    id: 3, url: "images/7.jpg", shape: "square", like: 10, dislike: 5, ld: 0, comments: [
                    {name: "jorj", comment: "cool", date: 1488811539662}, {
                        name: "mike",
                        comment: "best",
                        date: 1488811539662
                    }, {name: "zelly", comment: "wow", date: 1488811539662}
                ]
                },
                {
                    id: 4, url: "images/4.jpg", shape: "square", like: 10, dislike: 5, ld: 0, comments: [
                    {name: "jorj", comment: "cool", date: 1488811539662}, {
                        name: "mike",
                        comment: "best",
                        date: 1488811539662
                    }, {name: "zelly", comment: "wow", date: 1488811539662}
                ]
                },
                {
                    id: 5, url: "images/8.jpg", shape: "horizontal", like: 10, dislike: 5, ld: 0, comments: [
                    {name: "jorj", comment: "cool", date: 1488811539662}, {
                        name: "mike",
                        comment: "best",
                        date: 1488811539662
                    }, {name: "zelly", comment: "wow", date: 1488811539662}
                ]
                },
                {
                    id: 8, url: "images/6.jpg", shape: "square", like: 10, dislike: 5, ld: 0, comments: [
                    {name: "jorj", comment: "cool", date: 1488811539662}, {
                        name: "mike",
                        comment: "best",
                        date: 1488811539662
                    }, {name: "zelly", comment: "wow", date: 1488811539662}
                ]
                }
            ]
        }
    };

    ui.isotope = {
        init: function () {
            var grid = $("#content-wrapper").isotope({
                itemSelector: ".image-wrapper",
                layoutMode: "masonryHorizontal",
                getSortData: {
                    number: "[data-id] parseInt"
                },
                masonryHorizontal: {
                    rowHeight: 0
                }
            });
            grid.isotope({sortBy: "number"});
        }
    };

    ui.centerInBrowser = {
        init: function () {
            var height = (window.innerHeight > 0) ? window.innerHeight : screen.height,
                $centerWrapper = $(".center-wrapper"),
                $html = $("html");
            if (!$html.hasClass("touch-device")) {
                $centerWrapper.css("height", "768px");
            } else {
                $centerWrapper.css("height", height + "px");
            }
            if ($html.hasClass("touch-device")) {
                $("#content-wrapper").css("height", (height - 133) + "px")
            }
        }
    };

    ui.resize = {
        init: function () {
            if (ui.var.resizeAdded === false) {
                ui.var.resizeAdded = true;
                window.addEventListener("resize", ui.resize.reload);
            }
        },
        reload: function () {
            $("#content-wrapper").remove();
            ui.generateItems();
        }
    };

    ui.DetectTouch = function () {
        if ("ontouchstart" in window || navigator.maxTouchPoints) {
            $("html").addClass("touch-device");
        }
    };

    return ui;
}();

$(function () {
    Gallery.UI.DetectTouch();
    Gallery.UI.init();
});
