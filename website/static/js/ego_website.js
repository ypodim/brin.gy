
// cookie management

cookies = {};

cookies.get_cookie = function()
{
    cookie = {pseudonyms:{}};
    cookie_str = $.cookie('bringy', {path:"/"});
    if (typeof(cookie_str) == "string"){
        cookie = JSON.parse(cookie_str);
//         console.log(cookie_str);
    }
    return cookie;
}

cookies.set_cookie = function(name, secret)
{
    if (secret == undefined)
        secret = 0
    cookie_str = $.cookie('bringy', {path:"/"});
//     console.log("set_cookie other_names1", cookie_str, name);
    if (typeof(cookie_str) != "string") 
        cookie_str = "{}";
    
    cookie = JSON.parse(cookie_str);
    if (cookie.pseudonyms == undefined)
        cookie.pseudonyms = {};
    cookie.pseudonyms[name] = secret;    
    cookie_str = JSON.stringify(cookie);
//     console.log("set_cookie other_names2", cookie_str, secret);
    $.cookie('bringy', cookie_str, {expires:7, path:"/"});
}

cookies.del_cookie = function(name)
{
    cookie = {};
    cookie_str = $.cookie('bringy', {path:"/"});
//     console.log("delete: cookie_str is:", cookie_str);
    if (typeof(cookie_str) == "string")
        cookie = JSON.parse(cookie_str);
//     console.log("names before", names);
    delete cookie.pseudonyms[name];
//     console.log("names after", names);
    cookie_str = JSON.stringify(cookie);
    $.cookie('bringy', cookie_str, {expires:7, path:"/"});
}

cookies.upgrade_cookie = function()
{
    cookie_str = $.cookie('other_names', {path:"/"});
    if (typeof(cookie_str) == "string"){
        cookie = JSON.parse(cookie_str);
    }
    console.log("other_names", cookie);
}



mapman = {};
mapman.markers = [];
mapman.initialize = function() {
    mapman.infowindow = new google.maps.InfoWindow({content:""});
    
    lat = 42.360367;
    lon = -71.087294;
    latlng = new google.maps.LatLng(lat, lon);
    myOptions = {
        zoom: 14,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    mapman.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    mapman.mgr = new MarkerManager(mapman.map);
}

mapman.addMarker = function(aid, location) {
    if (aid in mapman.markers) {
//         console.log("enabling marker", aid);
        mapman.markers[aid].setVisible(true);
//         mapman.markers[aid].setMap(mapman.map);
        return true;
    }
    marker = new google.maps.Marker({
        position: location,
        map: mapman.map,
        aid: aid,
        valid: true,
    });
    google.maps.event.addListener(marker, 'click', function(event){
        mapman.infowindow.setContent(this.aid);
        mapman.infowindow.setPosition(event.latLng);
        mapman.infowindow.open(mapman.map, this);
    });
    mapman.markers[aid] = marker;
}

mapman.highlightMarker = function(aid) {
    if (mapman.markers[aid]) {
        marker = mapman.markers[aid];
        latlng = marker.getPosition();
        mapman.infowindow.setContent(aid);
        mapman.infowindow.setPosition(latlng);
        mapman.infowindow.open(mapman.map, marker);
    }
}

mapman.hideInvalidMarkers = function() {
    if (mapman.markers) {
        for (aid in mapman.markers) {
//             console.log("checking marker", aid, mapman.markers[aid].valid);
            if (mapman.markers[aid].valid == false) {
//                 console.log("hiding marker", aid);
                mapman.markers[aid].setVisible(false);
                mapman.markers[aid].setMap(null);
                delete mapman.markers[aid];
            }
        }
    }
}

mapman.invalidateMarkers = function() {
    if (mapman.markers) {
        for (aid in mapman.markers)
            mapman.markers[aid].valid = false;
    }
}

mapman.validateMarker = function(aid) {
//     console.log("validating marker", aid, mapman.markers[aid]);
    if (mapman.markers && mapman.markers[aid]) {
        mapman.markers[aid].valid = true;
        return true;
    } else
        return false;
}

// Removes the overlays from the map, but keeps them in the array
mapman.clearOverlays = function() {
    if (mapman.markers) {
        for (aid in mapman.markers)
            mapman.markers[aid].setMap(null);
    }
}

// Shows any overlays currently in the array
mapman.showOverlays = function() {
    if (mapman.markers) {
        for (aid in mapman.markers)
            mapman.markers[aid].setMap(mapman.map);
    }
}

// Deletes all markers in the array by removing references to them
mapman.deleteOverlays = function() {
    if (mapman.markers) {
        for (aid in mapman.markers)
            if (mapman.markers[aid]) {
                mapman.markers[aid].setMap(null);
                delete mapman.markers[aid];
            }
//         delete mapman.markers;
    }
}



