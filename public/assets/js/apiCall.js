function getChannelBySearch(search, callback) {
    getJSON("/api/get/channels-" + search, callback);
}

function addFollowToUser(channelId, callback) {
    getResponse("/api/post/follow-" + channelId, callback)
}

var getJSON = function (url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onloadend = function () {
        var status = xhr.status;
        if (status === 200) {
            callback(null, xhr.response);
        } else {
            callback(status, xhr.response);
        }
    };
    xhr.send();
};
var getResponse = function (url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onloadend = function () {
        var status = xhr.status;
        if (status === 200) {
            callback(null, xhr.status);
        } else {
            callback(status, xhr.status);
        }
    };
    xhr.send();
};

function compareChannelsSubscribersCount(a, b) {
    if (parseInt(a.statistics.subscriberCount) > parseInt(b.statistics.subscriberCount))
        return -1;
    if (parseInt(a.statistics.subscriberCount) < parseInt(b.statistics.subscriberCount))
        return 1;
    return 0;
}

function compareVideoPublishedAt(a, b) {
    return new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt);
}


function prettyDate(time) {
    var date = new Date(time),
        diff = (((new Date()).getTime() - date.getTime()) / 1000),
        day_diff = Math.floor(diff / 86400),
        month_diff = Math.floor(diff / (86400 * 31));

    if (isNaN(day_diff) || day_diff < 0)
        return;

    return day_diff == 0 && (
        (diff < 60 && month_diff === 0) && "à l'instant" ||
        (diff < 120 && month_diff === 0) && "Il y a 1 minute" ||
        (diff < 3600 && month_diff === 0) && "Il y a " + Math.floor(diff / 60) + " minutes" ||
        (diff < 7200 && month_diff === 0) && "Il y a 1 heure" ||
        (diff < 86400 && month_diff === 0) && "Il y a " + Math.floor(diff / 3600) + " heures") ||
        (day_diff === 1 && month_diff === 0) && "Hier " ||
        (day_diff < 7  && month_diff === 0) && "Il y a " + day_diff + " jours" ||
        (day_diff < 31 && month_diff === 0) && "Il y a " + Math.ceil(day_diff / 7) + " semaines" ||
        month_diff === 1 && "1 mois " ||
        month_diff > 0 && "Il y a " + month_diff + " mois";
}

function prettyNumber(number) {
    number = number.replace(/(?!^)(?=(?:\d{3})+(?:\.|$))/gm, ' ');
    return number;
}
