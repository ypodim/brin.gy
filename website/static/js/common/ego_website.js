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

var common = {
    cookies: {
        get_cookie: function()
        {
            cookie = {pseudonyms:{}};
            cookie_str = $.cookie('bringy', {path:"/"});
            if (typeof(cookie_str) == "string"){
                cookie = JSON.parse(cookie_str);
        //         console.log("get_cookie:",cookie_str);
            }
            return cookie;
        },

        set_cookie: function(name, secret)
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
        },

        del_cookie: function(name)
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
        },

        upgrade_cookie: function()
        {
            agent_url = "http://agents.brin.gy/retrieve_secret";
            
            cookie_str = $.cookie('other_names', {path:"/"});
            if (cookie_str && typeof(cookie_str) == "string"){
                
                console.log("bringy cookie before:", this.get_cookie());
                cookie_str = $.cookie('other_names', {path:"/"});
                
                cookie = JSON.parse(cookie_str);
                console.log("other_names", cookie, cookie_str);
                for (user in cookie) {
                    $.getJSON(agent_url, {user:user}, function(json){
                        console.log("got back from retrieve_secret:", json.user, json.stored_secret);
                        this.set_cookie(json.user, json.stored_secret);
                        console.log("bringy cookie after:", this.get_cookie());
                    });
                }
            } else
                console.log("other_names not found in cookie, good.");
        },
    },

    mapman: {
        markers: [],
        initialize: function() {
            this.infowindow = new google.maps.InfoWindow({content:""});
            
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

            this.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
            this.mgr = new MarkerManager(this.map);
        },

        addMarker: function(aid, location) {
            if (aid in this.markers) {
                this.markers[aid].setVisible(true);
        //         this.markers[aid].setMap(this.map);
                return true;
            }
            marker = new google.maps.Marker({
                position: location,
                map: this.map,
                aid: aid,
                valid: true,
            });
            google.maps.event.addListener(marker, 'click', function(event){
                this.infowindow.setContent(this.aid);
                this.infowindow.setPosition(event.latLng);
                this.infowindow.open(this.map, this);
            });
            this.markers[aid] = marker;
        },

        highlightMarker: function(aid) {
            if (this.markers[aid]) {
                marker = this.markers[aid];
                latlng = marker.getPosition();
                this.infowindow.setContent(aid);
                this.infowindow.setPosition(latlng);
                this.infowindow.open(this.map, marker);
            }
        },

        hideInvalidMarkers: function() {
            if (this.markers) {
                for (aid in this.markers) {
                    if (this.markers[aid].valid == false) {
                        this.markers[aid].setVisible(false);
                        this.markers[aid].setMap(null);
                        delete this.markers[aid];
                    }
                }
            }
        },

        invalidateMarkers: function() {
            if (this.markers) {
                for (aid in this.markers)
                    this.markers[aid].valid = false;
            }
        },

        validateMarker: function(aid) {
        //     console.log("validating marker", aid, this.markers[aid]);
            if (this.markers && this.markers[aid]) {
                this.markers[aid].valid = true;
                return true;
            } else
                return false;
        },

        // Removes the overlays from the map, but keeps them in the array
        clearOverlays: function() {
            if (this.markers) {
                for (aid in this.markers)
                    this.markers[aid].setMap(null);
            }
        },

        // Shows any overlays currently in the array
        showOverlays: function() {
            if (this.markers) {
                for (aid in this.markers)
                    this.markers[aid].setMap(this.map);
            }
        },

        // Deletes all markers in the array by removing references to them
        deleteOverlays: function() {
            if (this.markers) {
                for (aid in this.markers)
                    if (this.markers[aid]) {
                        this.markers[aid].setMap(null);
                        delete this.markers[aid];
                    }
        //         delete this.markers;
            }
        },
    },

    geogy: {
        init: function(clb){
            this.geocoder = new google.maps.Geocoder();
            this.clb = clb;
            this.result = {error:""};
            this.load("http://geo-location-javascript.googlecode.com/svn/trunk/js/geo-min.js");
            this.tryReady(0);
        },

        load: function(js) {
            var script = document.createElement('script')
            script.setAttribute("type","text/javascript")
            script.setAttribute("src", js)
            if (typeof script!="undefined")
                document.getElementsByTagName("head")[0].appendChild(script);
        },

        tryReady: function(time_elapsed) {
            if (typeof $ == "undefined" || typeof geo_position_js == "undefined") {
                if (time_elapsed <= 5000) {
                    setTimeout("this.tryReady(" + (time_elapsed + 200) + ")", 200);
                } else {
                    this.result.error = "Timed out while loading jQuery/geo_position_js.";
                }
            } else {
                this.onload();
            }
        },

        geo_success: function(p)
        {
            this.result.lat = p.coords.latitude;
            this.result.lon = p.coords.longitude;
            console.log("location ready");
            if (typeof this.clb != "undefined") {
                this.clb(this.result);
            }
        },

        geo_error: function()
        {
            this.result.error = "You did not allow access to your location.";
            if (typeof this.clb != "undefined") {
                this.clb(this.result);
            }
        },

        onload: function() 
        {
            if (geo_position_js.init()) {
                geo_position_js.getCurrentPosition(this.geo_success, this.geo_error);
            } else {
                this.result.error = "Error loading location module.";
            }
        },
    },
};

return common;
});