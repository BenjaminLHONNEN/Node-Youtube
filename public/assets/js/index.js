var app;

window.onload = function () {
    var searchInput = document.getElementById("searchInput"),
        searchButton = document.getElementById("searchButton");


    searchButton.onclick = function () {
        searchChannels();
    };

    searchInput.onkeypress = function (event) {
        if (event.key === "Enter") {
            searchChannels();
        }
    };

    app = new Vue({
        el: '#app',
        data: {
            channels: []
        }
    });

    $(document).ready(function(){
        $('.sidenav').sidenav();
    });
};

function searchChannels() {
    var searchInput = document.getElementById("searchInput");
    getChannelBySearch(searchInput.value, function (err, data) {
        console.log(data);
        if (err !== null) {
            console.error("Erreur : ", err)
        } else {
            var items = data.items;
            items.sort(compareChannelsSubscribersCount);
            items.forEach(function (value,index,array) {
                items[index].statistics.subscriberCountPretty = prettyNumber(value.statistics.subscriberCount);
                items[index].statistics.videoCountPretty = prettyNumber(value.statistics.videoCount);
            });
            app.channels = items;
        }
    });
}

function addFollow(channelId) {
    addFollowToUser(channelId,function (err,statusCode) {
        console.log(statusCode);
        if (err !== null) {
            console.error("Erreur : ", err)
        } else {
            console.log("addFollow Success !")
        }
    })
}
