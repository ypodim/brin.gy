define([
  // These are path alias that we configured in our bootstrap
  'jquery',     // lib/jquery/jquery
  'underscore', // lib/underscore/underscore
  'backbone',   // lib/backbone/backbone
  'cookie',
], function($, _, Backbone, ck){
  // Above we have passed in jQuery, Underscore and Backbone
  // They will not be accesible in the global scope

// cookie management

var common = {};

common.cookies = {};
common.cookies.get_cookie = function()
{
    cookie = {pseudonyms:{}};
    cookie_str = $.cookie('bringy', {path:"/"});
    if (typeof(cookie_str) == "string"){
        cookie = JSON.parse(cookie_str);
//         console.log("get_cookie:",cookie_str);
    }
    return cookie;
}

common.cookies.set_cookie = function(name, secret)
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

common.cookies.del_cookie = function(name)
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

common.cookies.upgrade_cookie = function()
{
    agent_url = "http://agents.brin.gy/retrieve_secret";
    
    cookie_str = $.cookie('other_names', {path:"/"});
    if (cookie_str && typeof(cookie_str) == "string"){
        
        console.log("bringy cookie before:", common.cookies.get_cookie());
        cookie_str = $.cookie('other_names', {path:"/"});
        
        cookie = JSON.parse(cookie_str);
        console.log("other_names", cookie, cookie_str);
        for (user in cookie) {
            $.getJSON(agent_url, {user:user}, function(json){
                console.log("got back from retrieve_secret:", json.user, json.stored_secret);
                common.cookies.set_cookie(json.user, json.stored_secret);
                console.log("bringy cookie after:", common.cookies.get_cookie());
            });
        }
    } else
        console.log("other_names not found in cookie, good.");
}



common.mapman = {};
common.mapman.markers = [];
common.mapman.initialize = function() {
    common.mapman.infowindow = new google.maps.InfoWindow({content:""});
    
    lat = 42.360367;
    lon = -71.087294;
    latlng = new google.maps.LatLng(lat, lon);
    myOptions = {
        panControl: false,
        zoomControl: false,
        scaleControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        overviewMapControl: false,
        
        zoom: 14,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    common.mapman.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    common.mapman.mgr = new MarkerManager(common.mapman.map);
}

common.mapman.addMarker = function(aid, location) {
    if (aid in common.mapman.markers) {
        common.mapman.markers[aid].setVisible(true);
//         common.mapman.markers[aid].setMap(common.mapman.map);
        return true;
    }
    marker = new google.maps.Marker({
        position: location,
        map: common.mapman.map,
        aid: aid,
        valid: true,
    });
    google.maps.event.addListener(marker, 'click', function(event){
        common.mapman.infowindow.setContent(this.aid);
        common.mapman.infowindow.setPosition(event.latLng);
        common.mapman.infowindow.open(common.mapman.map, this);
    });
    common.mapman.markers[aid] = marker;
}

common.mapman.highlightMarker = function(aid) {
    if (common.mapman.markers[aid]) {
        marker = common.mapman.markers[aid];
        latlng = marker.getPosition();
        common.mapman.infowindow.setContent(aid);
        common.mapman.infowindow.setPosition(latlng);
        common.mapman.infowindow.open(common.mapman.map, marker);
    }
}

common.mapman.hideInvalidMarkers = function() {
    if (common.mapman.markers) {
        for (aid in common.mapman.markers) {
            if (common.mapman.markers[aid].valid == false) {
                common.mapman.markers[aid].setVisible(false);
                common.mapman.markers[aid].setMap(null);
                delete common.mapman.markers[aid];
            }
        }
    }
}

common.mapman.invalidateMarkers = function() {
    if (common.mapman.markers) {
        for (aid in common.mapman.markers)
            common.mapman.markers[aid].valid = false;
    }
}

common.mapman.validateMarker = function(aid) {
//     console.log("validating marker", aid, common.mapman.markers[aid]);
    if (common.mapman.markers && common.mapman.markers[aid]) {
        common.mapman.markers[aid].valid = true;
        return true;
    } else
        return false;
}

// Removes the overlays from the map, but keeps them in the array
common.mapman.clearOverlays = function() {
    if (common.mapman.markers) {
        for (aid in common.mapman.markers)
            common.mapman.markers[aid].setMap(null);
    }
}

// Shows any overlays currently in the array
common.mapman.showOverlays = function() {
    if (common.mapman.markers) {
        for (aid in common.mapman.markers)
            common.mapman.markers[aid].setMap(common.mapman.map);
    }
}

// Deletes all markers in the array by removing references to them
common.mapman.deleteOverlays = function() {
    if (common.mapman.markers) {
        for (aid in common.mapman.markers)
            if (common.mapman.markers[aid]) {
                common.mapman.markers[aid].setMap(null);
                delete common.mapman.markers[aid];
            }
//         delete common.mapman.markers;
    }
}




common.geogy = {};
common.geogy.geocoder = new google.maps.Geocoder();
common.geogy.init = function(clb){
    common.geogy.clb = clb;
    common.geogy.result = {error:""};
    common.geogy.load("http://geo-location-javascript.googlecode.com/svn/trunk/js/geo-min.js");
    common.geogy.load.tryReady(0);
};

common.geogy.load = function(js) {
    var script = document.createElement('script')
    script.setAttribute("type","text/javascript")
    script.setAttribute("src", js)
    if (typeof script!="undefined")
        document.getElementsByTagName("head")[0].appendChild(script);
};

common.geogy.load.tryReady = function(time_elapsed) {
    if (typeof $ == "undefined" || typeof geo_position_js == "undefined") {
        if (time_elapsed <= 5000) {
            setTimeout("common.geogy.load.tryReady(" + (time_elapsed + 200) + ")", 200);
        } else {
            common.geogy.result.error = "Timed out while loading jQuery/geo_position_js.";
        }
    } else {
        common.geogy.onload();
    }
};

common.geogy.geo_success = function(p)
{
    common.geogy.result.lat = p.coords.latitude;
    common.geogy.result.lon = p.coords.longitude;
    console.log("location ready");
    if (typeof common.geogy.clb != "undefined") {
        common.geogy.clb(common.geogy.result);
    }
};

common.geogy.geo_error = function()
{
    common.geogy.result.error = "You did not allow access to your location.";
    if (typeof common.geogy.clb != "undefined") {
        common.geogy.clb(common.geogy.result);
    }
};

common.geogy.onload = function() 
{
    if (geo_position_js.init()) {
        geo_position_js.getCurrentPosition(common.geogy.geo_success, common.geogy.geo_error);
    } else {
        common.geogy.result.error = "Error loading location module.";
    }
};

  return common;
  // What we return here will be used by other modules
});