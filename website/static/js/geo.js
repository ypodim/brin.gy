/*!
 * Geo.gy API library 0.1
 * http://geo.gy/
 *
 * Copyright 2011, Polychronis Ypodimatopoulos
 * MIT Media Lab
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: Thu June 22, 2011
 */

var geogy = {};
geogy.geocoder = new google.maps.Geocoder();
geogy.init = function(clb){
    geogy.clb = clb;
    geogy.result = {error:""};
    geogy.load("http://geo-location-javascript.googlecode.com/svn/trunk/js/geo-min.js");
    geogy.load.tryReady(0);
};

geogy.load = function(js) {
    var script = document.createElement('script')
    script.setAttribute("type","text/javascript")
    script.setAttribute("src", js)
    if (typeof script!="undefined")
        document.getElementsByTagName("head")[0].appendChild(script);
};

geogy.load.tryReady = function(time_elapsed) {
    if (typeof $ == "undefined" || typeof geo_position_js == "undefined") {
        if (time_elapsed <= 5000) {
            setTimeout("geogy.load.tryReady(" + (time_elapsed + 200) + ")", 200);
        } else {
            geogy.result.error = "Timed out while loading jQuery/geo_position_js.";
        }
    } else {
        geogy.onload();
    }
};

geogy.geo_success = function(p)
{
    geogy.result.lat = p.coords.latitude;
    geogy.result.lon = p.coords.longitude;
    console.log("location ready");
    if (typeof geogy.clb != "undefined") {
        geogy.clb(geogy.result);
    }
};

geogy.geo_error = function()
{
    geogy.result.error = "You did not allow access to your location.";
    if (typeof geogy.clb != "undefined") {
        geogy.clb(geogy.result);
    }
};

geogy.onload = function() 
{
    if (geo_position_js.init()) {
        geo_position_js.getCurrentPosition(geogy.geo_success, geogy.geo_error);
    } else {
        geogy.result.error = "Error loading location module.";
    }
};


////////////////////// GEOCODING

// var latlng = new google.maps.LatLng(40.730885,-73.997383);
// geogy.geocoder.geocode({'latLng': latlng}, function(results, status) {
//     if (status == google.maps.GeocoderStatus.OK) {
//         if (results[1]) {
//             console.log(results);
//         }
//     } else {
//         alert("Geocoder failed due to: " + status);
//     }
// });

