var app,
    lastVideosByChannel = [],
    videoListId ="",
    following = [],
    nbLastVideoLoad,
    nbLastVideoToLoad
;

window.onload = function () {
    app = new Vue({
        el: '#app',
        data: {
            channels: {},
            videoDetailObj: null,
            videos: null,
            videoDetail:false,
            videoDetailComments:null,
        }
    });

    $(document).ready(function(){
        $('.sidenav').sidenav();
    });

    getFollowingChannelOfUser();

};

function getFollowingChannelOfUser() {
    getJSON("/api/get/following", function (err, body) {
        if (!err) {
            console.log(body);
            following = body;
            nbLastVideoLoad=0;
            nbLastVideoToLoad=following.length;
            console.log("nbLastVideoToLoad : " + nbLastVideoToLoad);
            body.forEach(function (value, index, array) {
                getLastVideoInfoByChannelId(value);
                getChannelInfoByChannelId(value);
            });
        }
    });
}

function getLastVideoInfoByChannelId(value) {
    getJSON("/api/get/getLastVideos-" + value.channelId, function (err, body1) {
        if (!err) {
            lastVideosByChannel.push(body1);
            console.log("lastVideosByChannel : ", lastVideosByChannel);
            nbLastVideoLoad++;
            if (nbLastVideoLoad === nbLastVideoToLoad) {
                videoListId = "";
                lastVideosByChannel.forEach(function (value1, index1, array1) {
                    value1.items.forEach(function (value2, index2, array2) {
                        videoListId += value2.id.videoId;
                        if (index2 !== array2.length - 1) {
                            videoListId += ",";
                        }
                    });
                });
                getVideosByIdsStr();
            }
        }
    });
}

function getChannelInfoByChannelId(value) {
    getJSON("/api/get/channel-" + value.channelId, function (err, body) {
        if (!err) {
            app.channels[body.channelId] = body;
        }
    })
}

function getVideosByIdsStr() {
    getJSON("/api/get/videos-" + videoListId, function (err, body2) {
        console.log(err);
        console.log(body2);
        if (!err && body2) {
            body2.items.sort(compareVideoPublishedAt);
            body2.items.forEach(function (value,index,array) {
                body2.items[index].snippet.prettyDate = prettyDate(value.snippet.publishedAt);
                body2.items[index].player.embedHtml = body2.items[index].player.embedHtml.replace('height="270"','');
                body2.items[index].player.embedHtml = body2.items[index].player.embedHtml.replace('width="480"','');
            });
            app.videos = null;
            app.videos = body2;
        } else if (body2 === null){
            getVideosByIdsStr();
        }
    })
}

function toggleVideoDetail(id) {
    app.videoDetail = true;
    app.videoDetailObj = app.videos.items[id];
    setTimeout(function () {
        loadComments();
    },500);
}
$('.dropdown-trigger').dropdown();

function getTextareaValueByArticleId(id, callback) {
    var textarea = document.getElementById("textarea-" + id);
    callback(id, textarea.value);
}
function addComment(id, comment) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/post/comment-" + id, true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.onloadend = function () {
        var status = xhr.status;
        if (status === 200) {
            loadComments();
        } else {
            console.error("addComment(" + id + ") : ", xhr.response, "response code : " + status);
        }
    };
    xhr.send("comment=" + comment);
}

function loadComments() {
    console.log("load comments");
    getJSON("/api/get/comments-"+app.videoDetailObj.id,
        function (err, data) {
            if (err !== null) {
                console.error("Erreur : ", err)
            } else {
                app.videoDetailComments = null;
                if(data.length !==0){
                    app.videoDetailComments = data;
                }
            }
        });
}