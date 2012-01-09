define([
  // These are path alias that we configured in our bootstrap
  'jquery',     // lib/jquery/jquery
  'underscore', // lib/underscore/underscore
  'backbone',   // lib/backbone/backbone
  'alerts',
  'modal',
  'order!twipsy',
  'order!popover',
  'common/ego_website',
], function($, _, Backbone, alerts, modal, popover, twipsy, common){
  // Above we have passed in jQuery, Underscore and Backbone
  // They will not be accesible in the global scope


// sdata example:
// profile = {
//      languages: {
//              selected: false,
//              display: true,
//              cnt: 109,
//              matches: {},
//              values: {
//                      greek: {
//                              cnt: 9,
//                              haveit: true,
//                              selected: false,
//                              display: true,
//                              matches: {},
//                              visited: false,
//                      },
//              },
//      },
// }

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

attr_manager = {
initialize: function() {
    _.bindAll(this, 'populate_attrs', 'poll_matches');
},
cache: {},
sdata: {
    
    location:{
        "my location":{cnt:0, values:{}, selected:0, display:true, matches:{}},
//         "destination":{},
    },
    profile:{},
//     buysell:{
//         "product":{},
//     },
},

reset_sdata: function() {
    attr_manager.sdata = {
        location:{
            "my location":{cnt:0, values:{}, selected:0, display:true, matches:{}},
        },
        profile:{},
    };
},

add_sdata: function(cap, key, cnt) {
    if (cap==undefined || key==undefined || cnt==undefined){
        console.log("*** add_sdata: undefined var:", cap, key, cnt);
        return;
    }
    if (attr_manager.sdata[cap] == undefined)
        attr_manager.sdata[cap] = {};
    
    attr_manager.sdata[cap][key] = {cnt:0, values:{}, selected:0, display:true, matches:{}};
},

hide_keyvals: function(){
    for (cap in this.sdata) {
        for (key in this.sdata[cap]){
            attr_manager.sdata[cap][key].display = false;
            for (val in this.sdata[cap][key].values){
                attr_manager.sdata[cap][key].values[val].display = false;
            }
        }
    }
},

show_keyvals: function(){
    for (cap in this.sdata) {
        for (key in this.sdata[cap]){
            attr_manager.sdata[cap][key].display = true;
            for (val in this.sdata[cap][key].values){
                attr_manager.sdata[cap][key].values[val].display = true;
            }
        }
    }
},

deselect_keyvals: function(){
    for (cap in this.sdata) {
        for (key in this.sdata[cap]){
            attr_manager.sdata[cap][key].selected = false;
            for (val in this.sdata[cap][key].values){
                attr_manager.sdata[cap][key].values[val].selected = false;
            }
        }
    }
},

get_location: function() {
    for (val in attr_manager.sdata.location["my location"].values)
        if (attr_manager.sdata.location["my location"].values[val].haveit)
            return val;
    return null;
},

monitor: {
    "user_matches":{
        "by_keyval": {},
        "intersection": [],
    },
},

previous_intersection: {},
// holds the first list of intersected agents among two consecutive
// intersection polls, so that the intersection and difference between
// the consecutive lists can be found fast and have the results list 
// change accordingly without resetting the whole list.


last_fetched: "",
formatted_length: 24,

///////////////////////////////////////////////


post_visited_keyval: function(context) {
    data = {};
    for (key in attr_manager.sdata.profile) {
        data[key] = [];
        for (val in attr_manager.sdata.profile[key].values)
            data[key].push(val);
    }
    
    secret = cookies.get_cookie().pseudonyms[E.agent.id];
    if (secret == undefined) {
        console.log("Not allowed to change "+E.agent.id+"'s profile.");
        return {error:"Not allowed to change "+E.agent.id+"'s profile."};
    }
    params = {data:JSON.stringify(data), secret:secret, context:context};
    console.log("setting visited", params);
    
    $.post(E.agent.url+"/profile/visited", params, function(json){
//         console.log("visited", json);
    }, "json");
},

post_keyval: function(cap, key, val, clb) {
    data = JSON.stringify([[key, val]]);
    if (clb == undefined)
        clb = function(json){
            console.log("post", json);
        }
    
    secret = cookies.get_cookie().pseudonyms[E.agent.id];
    if (secret == undefined) {
        clb({error:"Not allowed to change "+E.agent.id+"'s profile."});
        return false;
    }
    $.post(E.agent.url+"/"+cap, {data:data, secret:secret, context:E.context.context}, function(json){
        clb(json);
    }, "json");
},

delete_keyval: function(cap, key, val, clb) {
    if (clb == undefined)
        clb = function(json){
            console.log("post", json);
        }
    
    secret = cookies.get_cookie().pseudonyms[E.agent.id];
    if (secret == undefined) {
        clb({error:"Not allowed to change "+E.agent.id+"'s profile."});
        return false;
    }
    data = JSON.stringify([[key, val]]);
    $.ajax({
        type: "DELETE",
        url: E.agent.url+"/"+cap,
        data: {data:data, secret:secret, context:E.context.context},
        success: clb,
        dataType: "json",
    });
},

populate_map: function(obj) {
    for (agent in obj) {
        exists = common.mapman.validateMarker(agent);
        if (!exists) {
            lat = obj[agent].lat;
            lon = obj[agent].lon;
            if (lat && lon) {
                var latlng = new google.maps.LatLng(lat, lon);
                common.mapman.addMarker(agent, latlng);
            }
        }
    }
    
    common.mapman.hideInvalidMarkers();
    
    if (this.reset_map_bounds) {
        //  Create a new viewpoint bound
        var bounds = new google.maps.LatLngBounds();
        //  Go through each...
        for (aid in common.mapman.markers) {
            bounds.extend(common.mapman.markers[aid].position);
        }
        
        if (Object.size(common.mapman.markers)) {
            //  Fit these bounds to the map
            common.mapman.map.fitBounds(bounds);
            zoom = common.mapman.map.getZoom();
            if (common.mapman.map.getZoom() > 16)
                common.mapman.map.setZoom(16);
        } else {
//             latlng = new google.maps.LatLng(42.360367, -71.087294);
//             common.mapman.map.setCenter(latlng);
        }
        this.reset_map_bounds = false;
    }
},

set_matches: function(stop, nonce) {
    if (nonce == undefined) {  
        stop = parseInt($("#matches").attr("curpos"));
    } else {
        $("#matches").attr("curpos", stop);
        $("title").html("Brin.gy ("+stop+")");
    }
    
    start = parseInt($("#matches").html());
    step = 1;
    
    if (Math.abs(start-stop) > 10) { step = 10 }
    if (Math.abs(start-stop) > 100) { step = 100 }
    if (Math.abs(start-stop) > 1000) { step = 1000 }
    if (start > stop) {
        $("#matches").html(start-step);
        setTimeout(this.set_matches, 20);
    }
    if (start < stop) {
        $("#matches").html(start+step);
        setTimeout(this.set_matches, 20);
    }
},

post_toggle_filter: function(){
    newtop = $("#filters").height() + 10;
    $("#results").css("top",newtop);
},

toggle_filter: function(action, cap, key, val){
    attr = {cap:cap,key:key,val:val,type:"valfilter"};
    if (action == "remove") {
        query = ".filter-item[cap='"+cap+"'][key='"+key+"']";
        if (val != undefined)
            query += "[val='"+val+"']";
        else 
            query += "[type='keyfilter']";
        
        $(query).remove();
        setTimeout(function(){
            if ("removed", $(".filter-item").length == 0) {
                $("#clear-filters-btn").hide();
                $("#results-container").animate({width:"100%"}, 200);
//                 $("#results-container").width("100%");
            }
        }, 400);
        
        return true;
    }
    
    $("#results-container").animate({width:"160px"}, 200);
//     $("#results-container").width("160px");
//     setTimeout(function(){
        
//     }, 200);
    $("#clear-filters-btn").show();
    
    valstr = "<span class='highlight'>"+val+"</span>";
    if (val == undefined) {
        attr['type'] = "keyfilter";
        valstr = "anything";
    }
    
    closebtn = $("<a href='#'>×</a>").addClass("closebtn").attr(attr);
    closebtn.click(function(){
        cap = $(this).attr("cap");
        key = $(this).attr("key");
        val = $(this).attr("val");
        query = "[cap='"+cap+"'][key='"+key+"']";
        if (val == undefined) {
            query += "[type='keypart']";
            attr_manager.sdata[cap][key].selected = false;
        } else {
            query += "[val='"+val+"'][type='valpart']";
            attr_manager.sdata[cap][key].values[val].selected = false;
        }
        
        if ($(query).length == 0) {
            this.toggle_filter("remove", cap, key, val);
        } else
            $(query).click();
        
        return false;
    });
    title = "<span class='highlight'>"+key+"</span> is "+valstr;
    filter = $("<p></p>").append(title).append(closebtn).addClass("filter-item");
    filter.attr(attr);
    $("#filters").append(filter);
},

handle_key_click: function(){
    cap = $(this).attr("cap");
    key = $(this).attr("key");
    
    pressed = $(this).hasClass("pressed");
    attr_manager.sdata[cap][key].selected = !pressed;
    if (pressed) {
        $(this).removeClass("pressed");
        this.toggle_filter("remove", cap, key);
    } else {
        $(this).addClass("pressed");
        $(this).siblings("div").children().children().removeClass("pressed");
        for (val in attr_manager.sdata[cap][key].values) {
            attr_manager.sdata[cap][key].values[val].selected = false;
            this.toggle_filter("remove", cap, key, val);
        }
        this.toggle_filter("add", cap, key);
    }
    this.post_toggle_filter();
    
    this.poll_matches(cap);
    this.reset_map_bounds = true;
    return false;
},

handle_val_click: function(){
    cap = $(this).attr("cap");
    key = $(this).attr("key");
    val = $(this).attr("val");
    
    pressed = $(this).hasClass("pressed");
    attr_manager.sdata[cap][key].values[val].selected = !pressed;
    if (pressed) {
        $(this).removeClass("pressed");
        this.toggle_filter("remove", cap, key, val);
    } else {
        $(this).addClass("pressed");
        $(this).parent().parent().siblings("a").removeClass("pressed");
        attr_manager.sdata[cap][key].selected = false;
        this.toggle_filter("remove", cap, key);
        this.toggle_filter("add", cap, key, val);
    }
    this.post_toggle_filter();
    
    this.poll_matches(cap);
    this.reset_map_bounds = true;
    return false;
},

get_geocode: function(latlng, clb) {
    geogy.geocoder.geocode({'latLng': latlng}, function(results, status) {
        lat = results[0].geometry.location.lat();
        lon = results[0].geometry.location.lng();
        val = JSON.stringify({lat:""+lat,lon:""+lon});
        
        if (status == google.maps.GeocoderStatus.OK) {
            key = "my location";
            formatted = results[0].formatted_address;
            console.log('formatted address:', formatted, key);
            
            attr_manager.sdata.location[key].values[val] = {
                cnt:0, 
                selected:false,
                display:true,
                haveit:true, 
                matches:[],
                formatted: formatted,
            };
            
            counter = $("span.attr_counters[uitype=\"user_attribute\"][cap=\"location\"][key=\"my location\"]");
            counter.attr("val",val);
            counter.parent().attr("val",val);
        } else {
            alert("Geocoder failed due to: " + status);
        }
        if (formatted.length > this.formatted_length)
            formatted = formatted.substring(0,this.formatted_length-3)+"...";
            
        if (clb != undefined)
            clb(val, results, formatted);
    });
},

get_geolocation: function(clb) {
    
    location_clb = function(result) {
        key = "my location";
        mdl = $("#modal-from-dom");
        clearTimeout(this.modal_timer);
        mdl.modal("hide");
        attr_manager.sdata.location[key].values = {};
        
        latlng = new google.maps.LatLng(result.lat, result.lon);
        this.get_geocode(latlng, clb);
        this.populate_map(result);
    }
    
    geogy.init(location_clb);
    show_modal = function() {
        mdl = $("#modal-from-dom");
        mdl.modal({backdrop:"static", show:true, keyboard:true});
        
        $("#modal-cancel-btn").click(function(){
            mdl.bind('hidden', function(){
                console.log("going to",E.website_url+"/manage/asdf");
                console.log("should go to", window.location);
//                     location.replace(E.website_url+"/manage/asdf");
            });
            mdl.modal("hide");
        });
    }
    this.modal_timer = setTimeout(show_modal, 500);
},

complete_toggle_handle: function(cap, key, val, button) {
    haveit = attr_manager.sdata[cap][key].values[val].haveit;
    if (haveit) {
        this.post_keyval(cap, key, val, function(json){
            if (json.error) {
                alert(json.error);
                attr_manager.sdata[cap][key].values[val].haveit = !haveit;
                return false;
            }
            button.html("\u2713").popover("hide").css("background-color","");
            
            $("pill[key=\""+key+"\"]").attr("me","true");
            $("div.valcontainer[cap=\""+cap+"\"][key=\""+key+"\"][val=\""+val+"\"]").attr("me","true");
            
            confirmation = $(".confirmation").html("added to your profile!");
            confirmation.addClass("success").removeClass("important").show();
            confirmation.offset(button.offset());
            
            confirmation.animate({"left":"+=30px","top":"-=50px"}, "slow", function(){ 
                $(this).animate({"left":"+=0px"}, function(){
                    $(this).hide();
                });
            });
        });
    } else {
        this.delete_keyval(cap, key, val, function(json){
            if (json.error) {
                alert(json.error);
                attr_manager.sdata[cap][key].values[val].haveit = !haveit;
                return false;
            }
            button.html("\u00A0").popover("hide").css("background-color","");
            
            $("pill[key=\""+key+"\"]").attr("me","");
            $("div.valcontainer[cap=\""+cap+"\"][key=\""+key+"\"][val=\""+val+"\"]").attr("me","");
            
            confirmation = $(".confirmation").html("removed");
            confirmation.addClass("important").removeClass("success").show();
            confirmation.offset(button.offset());
            
            confirmation.animate({"left":"+=30px","top":"-=50px"}, "slow", function(){ 
                $(this).hide();
            });
        });
    }
},

handle_userattr_toggle: function(){
    var cap = $(this).attr("cap");
    var key = $(this).attr("key");
    var val = $(this).attr("val");
    button = $(this);
    
    haveit = attr_manager.sdata[cap][key].values[val].haveit;
    attr_manager.sdata[cap][key].values[val].haveit = !haveit;
    if (cap == "location") {
        if (haveit == false) {
            clb = function(val, results, formatted) {
                button.attr("val", val);
                button.siblings().children("span.value").html(formatted);
                this.complete_toggle_handle(cap, key, val, button);
            };
            this.get_geolocation(clb);
        } else {
            button.siblings().children("span.value").html("");
            this.complete_toggle_handle(cap, key, val, button);
        }
    } else {
        this.complete_toggle_handle(cap, key, val, button);
    }
    return false;
},

handle_userattr_hover_in: function(){
    cap = $(this).attr("cap");
    key = $(this).attr("key");
    val = $(this).attr("val");
    
    color = "green";
    text = "+";
    if (attr_manager.sdata[cap][key].values[val].haveit) {
        color = "red";
        text = "-";
    }
    
    $(this).html(text).css("background-color",color);
},

handle_userattr_hover_out: function(){
    cap = $(this).attr("cap");
    key = $(this).attr("key");
    val = $(this).attr("val");
    
    text = "\u00A0";
//     console.log("hoverout:",cap,key,val,attr_manager.sdata[cap][key].values[val].haveit);
    if (attr_manager.sdata[cap][key].values[val].haveit) {
        text = "\u2713";
    }
    $(this).html(text).css("background-color","");
},

generate_key_entry: function(capname, attr) {
    // attr_counters class is used to group and iterate through all attribute counters
    count = $("<span></span>").addClass("count attr_counters");
    count.html(attr_manager.sdata[capname][attr].cnt);
    count.attr({uitype:"sat_attribute", cap:capname, key:attr});
    
    attribute = $("<span></span>").html(attr);
    pair = {cap:capname, key:attr, type:"keypart"};
    var keypart = $("<a href='#'></a>").append(attribute);
    keypart.append(count).attr(pair);
    keypart.click(this.handle_key_click);
    
    if (attr_manager.sdata[capname][attr].selected)
        keypart.addClass("pressed");
        
    return keypart;
},

generate_val_entry: function(capname, attr, val) {
    
    count = $("<span></span>").addClass("count attr_counters");
    count.html(attr_manager.sdata[capname][attr].values[val].cnt);
    count.attr({
        uitype:"user_attribute", cap:capname, key:attr, val:val,
    });
    count.addClass("attr_counters").attr(attr);
    
    formatted = val;
    
    address = "";
    if (capname=="location" && attr=="my location") {
        address = attr_manager.sdata[capname][attr].values[val].formatted;
        if (address == undefined)
            formatted = "";
        else
            formatted = address;
    }
    
    if (formatted.length > this.formatted_length)
        formatted = formatted.substring(0,this.formatted_length-3)+"...";
        
    value = $("<span class='value'></span>").html(formatted);
    
    pair = {cap:capname, key:attr, val:val, address:address};
    value_pill = $("<a href='#'></a>").attr(pair).click(this.handle_val_click);
    value_pill.attr("type","valpart");
    value_pill.append(count).append(value)
    value_pill.twipsy({placement:"below", offset:5, title:function(){
        cap = $(this).attr("cap");
        val = $(this).attr("val");
        address = $(this).attr("address");
        if (val.length > 10)
            if (cap == "location")
                return address
            else
                return val;
        return "";
    }});
    
    if (attr_manager.sdata[capname][attr].values[val].selected)
        value_pill.addClass("pressed");
    
    // ****** add_btn ****** add_btn ****** add_btn ******
    add_btn = $("<span class='add_btn' title='the title' data-content='the content'></span>").attr(pair);
    
    add_btn.click(this.handle_userattr_toggle);
    
    // ****** HOVER ****** HOVER ****** HOVER ******
    add_btn.hover(this.handle_userattr_hover_in, this.handle_userattr_hover_out);
    
    text = "\u00A0";
    if (attr_manager.sdata[capname][attr].values[val].haveit) {
        text = "\u2713";
    }
    
    // ****** POPOVER ****** POPOVER ****** POPOVER ******
    add_btn.html(text).popover({title:function(){
        return $(this).attr("key")+": "+$(this).attr("val");
    }, content:function(){
        cap = $(this).attr("cap");
        key = $(this).attr("key");
        val = $(this).attr("val");
        
        if (attr_manager.sdata[cap][key].values[val].haveit)
            return "Remove this from your profile.";
        else
            return "Add this to your "+cap;
    }, offset:15});
    
    value_container = $("<div class='valcontainer'></div>");
    value_container.append(value_pill).append(add_btn);
    pair["new"] = attr_manager.sdata[capname][attr].values[val].new;
    pair["me"] = attr_manager.sdata[capname][attr].values[val].haveit;
    value_container.attr(pair);
    return value_container;
},

generate_val_entry_editor: function(attr) {
    editor = $("<form class='editor' title='new value' data-content='the content'></form>");
    editbox = $("<input type='text' class='span2' class='editbox' />");
    editor.attr({key:attr});
    editbox.attr({key:attr, cap:"profile"}).attr("tabindex", this.tabindex);
    this.tabindex++;
    editbox.popover({title:function(){
        return $(this).attr("key");
    }, content:function(){
        key = $(this).attr("key");
        val = $(this).attr("val");
        if (val) {
            test = (val in attr_manager.sdata.profile[key].values);
            html = $("<div>"+val+":"+test+"</div>");
            if (test)
                html.html(val+": already exists").addClass("error");
            else
                html.html('press enter to save "<b>'+val+'</b>"');
            return html;
        }
        return 'Type new "'+$(this).attr("key")+'" entry';
    }, offset:15, html:true, animate:false, trigger:"focus"});
    editbox.keydown(function(obj){
        if (obj.keyCode == 8)
            val = $(this).val().substr(0,$(this).val().length-1);
        else if (obj.keyCode != 13)
            val = $(this).val()+String.fromCharCode(obj.keyCode);
        else
            val = "";
            
//         if (obj.metaKey || obj.altKey || obj.ctrlKey)
//             return false;
            
        val = val.toLowerCase();
        $(this).attr("val",val);
        $(this).popover('show');
    });
    editor.submit(function(){
        cap = "profile";
        key = $(this).attr("key");
        val = $(this).children("input").val();
        console.log("submitting", cap, key, val);
        test = (val in attr_manager.sdata.profile[key].values);
        if (!test) {
            attr_manager.sdata[cap][key].values[val] = {
                cnt:0, 
                selected:0,
                display:true,
                haveit:true, 
                matches:{},
                new:false,
            };
            
//             console.log(attr_manager.sdata.profile.name);
            
            value_container = this.generate_val_entry("profile", key, val);
            $(this).before(value_container);
            that = this;
            this.post_keyval(cap, key, val, function(){
                console.log("added", key, val);
                $(that).children("input").val("");
            });
        }
        return false;
    });
    editor.html(editbox);
    return editor;
},

populate_attrs: function(useEditor) {
    if ("{{config.secret}}".length == 0)
        useEditor = false;
        
    if (useEditor == undefined)
        useEditor = true;
        
    $("#choices").empty();
    for (capname in attr_manager.sdata) {

        app = $("<div></div>").addClass("clear");
        $("#choices").append(app).addClass("");
        for (attr in attr_manager.sdata[capname]) {
            
            if (attr_manager.sdata[capname][attr].display == false)
                continue;
            
            keypart = this.generate_key_entry(capname, attr);
            valpart = $("<div class='valpart'></div>");
            
            for (val in attr_manager.sdata[capname][attr].values) {
                if (attr_manager.sdata[capname][attr].values[val].display == false)
                    continue;
                value_container = this.generate_val_entry(capname, attr, val);
                valpart.append(value_container);
            }
            
            if (capname=="profile" && useEditor==true) {
                editor = this.generate_val_entry_editor(attr);
                valpart.append(editor);
            }
            
            pill = $("<pill></pill>").append(keypart).append(valpart).attr("key",attr);
            
            if (capname == "location") {
                pill.addClass("location");
                valpart.children("div").css("height",50);
            }
            
            pair = {new:false, me:false};
            for (val in attr_manager.sdata[capname][attr].values) {
                if (attr_manager.sdata[capname][attr].values[val].new == true)
                    pair.new = true;
                if (attr_manager.sdata[capname][attr].values[val].haveit)
                    pair.me = true;
            }
            pill.attr(pair);
            
            app.append(pill);
        }
    }
},

//////////////////////////////////////////////////

construct_result_enty: function(agent) {
    picture = "http://pldb.media.mit.edu/research/images/nophoto.gif";
    if (attr_manager.cache[agent])
        if (attr_manager.cache[agent].profile)
            if ("picture" in attr_manager.cache[agent].profile)
                for (p in attr_manager.cache[agent].profile.picture)
                    picture = p;
            
    pic = $("<img width=20 style='float:left; clear:left;' />").attr("src",picture);
    username = $("<span style='margin-left:5px'></span>").html(agent);
    entry = $("<a href='#'></a>").append(pic).append(username);
    entry.attr({agent:agent});
    that = this;
    entry.click(function(){
        agent = $(this).attr("agent");
        selected = $(this).hasClass("pressed");
        
        if (selected) {
            $(this).removeClass("pressed");
            attr_manager.show_keyvals();
            $("#userinfo").slideUp();
            
            useEditor = true;
        } else {
            $('#results a').removeClass("pressed");
            $(this).addClass("pressed");
            
            $("#userinfo").html("User: "+agent).slideDown();
            
            profile = attr_manager.cache[agent].profile;
            
            attr_manager.hide_keyvals();
            
            for (k in profile) {
                if (attr_manager.sdata.profile[k])
                    attr_manager.sdata.profile[k].display = true;
                else
                    continue;
                
                detail = $("<div></div>").html(k+":");
                for (val in profile[k]) {
                    attr_manager.sdata.profile[k].values[val].display = true;
                    detail.append(", "+val);
                }
            }
            useEditor = false;
        }

        that.populate_attrs(useEditor);
        
        if (that.location_engaged)
            common.mapman.highlightMarker(agent);
        
        return false;
    });
    return entry;
},

get_multi_profile: function(agents) {
    $.getJSON(E.agent.baseurl+"/batch_profile", {data:JSON.stringify(agents)}, function(json){
        for (agent in json.profiles) {
            profile = {};
            for (i in json.profiles[agent].data) {
                key = json.profiles[agent].data[i].key;
                val = json.profiles[agent].data[i].val;
                if (profile[key] == undefined)
                    profile[key] = {};
                profile[key][val] = 1;
            }
            
            if (attr_manager.cache[agent] == undefined)
                attr_manager.cache[agent] = {};
            attr_manager.cache[agent].profile = profile;
            
        }
    
        $.getJSON(E.agent.baseurl+"/batch_location", {data:JSON.stringify(agents)}, function(json){
            
            for (agent in json.locations) {
                locobj = json.locations[agent];
                
                if (attr_manager.cache[agent] == undefined)
                    attr_manager.cache[agent] = {};
                attr_manager.cache[agent].location = locobj;
            }
            this.populate_map(json.locations);
        });
        
        agentsobj = {};
        for (i in agents) {
            agent = agents[i];
            agentsobj[agent] = 1;
            if (this.previous_intersection[agent]==undefined) {
                entry = this.construct_result_enty(agent);
                $("#results").append(entry);
                this.previous_intersection[agent] = 1;
            }
        }
        
        for (agent in this.previous_intersection) {
            if (agentsobj[agent]==undefined) {
                $('a[agent="'+agent+'"]').slideUp().remove();
                delete this.previous_intersection[agent];
            }
        }
//         $("#cart-btn").show();
    });
},

poll_matches: function(capname) {
    btnclicked = 0;
    query = [];
    
    for (cap in attr_manager.sdata)
        for (key in attr_manager.sdata[cap]) {
            query.push([cap, key, ""]);
            for (val in attr_manager.sdata[cap][key].values) {
                query.push([cap, key, val]);
            }
        }
    
    data = JSON.stringify(query);
    that = this;
    $.post(E.satellite.url+"/multimatch", {data:data, context:E.context.context}, function(json){
        that.monitor.user_matches.by_keyval = {};
        
        for (i in json.matches) {
            
            match = json.matches[i];
            
            cap = match[0];
            key = match[1];
            val = match[2];
            cnt = match[3];
            matches = match[4];
            
            if (val.length > 0) {
                if (attr_manager.sdata[cap][key].values[val]==undefined)
                    console.log("***", cap, key, val, attr_manager.sdata);
                attr_manager.sdata[cap][key].values[val].cnt = cnt;
                attr_manager.sdata[cap][key].values[val].matches = matches;
            } else {
                if (attr_manager.sdata[cap][key].cnt==undefined)
                    console.log("***", cap, key, attr_manager.sdata);
                attr_manager.sdata[cap][key].cnt = cnt;
                attr_manager.sdata[cap][key].matches = matches;
            }
        }
        
        test_intersection = {};
        target_count = 0
        
        this.location_engaged = false;
        
        this.match_criteria = [];
        for (cap in attr_manager.sdata) {
            for (key in attr_manager.sdata[cap]) {
                for (val in attr_manager.sdata[cap][key].values) {
                    if (attr_manager.sdata[cap][key].values[val].selected) {
                        if (cap == "location")
                            this.location_engaged = true;
                        this.match_criteria.push([cap, key, val]);
                        for (i in attr_manager.sdata[cap][key].values[val].matches) {
                            agent = attr_manager.sdata[cap][key].values[val].matches[i];
                            if (test_intersection[agent] == undefined)
                                test_intersection[agent] = 0;
                            test_intersection[agent] += 1;
                        }
                        target_count += 1;
                    }
                }
                if (attr_manager.sdata[cap][key].selected) {
                    if (cap == "location")
                        this.location_engaged = true;
                    this.match_criteria.push([cap, key, ""]);
                    for (i in attr_manager.sdata[cap][key].matches) {
                        agent = attr_manager.sdata[cap][key].matches[i];
                        if (test_intersection[agent] == undefined)
                            test_intersection[agent] = 0;
                        test_intersection[agent] += 1;
                    }
                    target_count += 1;
                }
            }
        }
        
        common.mapman.invalidateMarkers();
        if (capname != undefined) {
            this.update_monitor();
        }
        
        intersection = [];
        for (match in test_intersection)
            if (test_intersection[match] == target_count) {
                intersection.push(match);
            }
        
        
        if (intersection.length > 0) {
            this.get_multi_profile(intersection);
        } else {
            $("#cart-btn").hide();
            $("#results").empty();
            common.mapman.deleteOverlays();
            this.previous_intersection = {};
        }
        
        
        that.monitor.user_matches.intersection = intersection;
        that.set_matches(Object.size(intersection), "external");
        
        $(".attr_counters").each(function(){
            if ($(this).attr("uitype") == "sat_attribute") {
                cap = $(this).attr("cap");
                key = $(this).attr("key");
                $(this).html(attr_manager.sdata[cap][key].cnt);
            }
            
            if ($(this).attr("uitype") == "user_attribute") {
                cap = $(this).attr("cap");
                key = $(this).attr("key");
                val = $(this).attr("val");
                
                if (attr_manager.sdata[cap][key] == undefined ||
                    attr_manager.sdata[cap][key].values[val] == undefined) {
                    $(this).remove();
                    cnt = 0;
                } else {
                    cnt = attr_manager.sdata[cap][key].values[val].cnt;
                    $(this).html(cnt);
                }
            }
        });
    }, "json");
},




fetch_initial_info: function(clb) {
    attr_manager.reset_sdata();
    targetcount = 2;
    count = 0;
    finished = function() {
        count++;
        if (count==targetcount) {
            clb();
        }
    }
    
    that = this;
    $.getJSON(E.agent.url+"/profile/visited", function(json){
        that.fetch_profile(json.data, finished);
        that.fetch_location(finished);
    });
},

fetch_profile: function(visited, clb) {
    if (this.last_fetched.length)
        console.log("continuing from", this.last_fetched);
    
    data = {user:E.agent.id, start_from:this.last_fetched};
    
    url = E.satellite.url+"/profile/"+E.context.context+"/keyvals";
    $.getJSON(url, data, function(json){

        for (i in json.items) {
            attribute = json.items[i].key;
            attr_manager.add_sdata("profile", attribute, 0);
            for (j in json.items[i].values) {
                val = json.items[i].values[j].val;
                cnt = json.items[i].values[j].score;
                haveit = (json.items[i].values[j].userhasit==1);
                
                newval = true;
                if (visited && attribute in visited && val in visited[attribute])
                    newval = false
//                 if (newval)
//                     console.log("new val:", attribute, val);
                    
                attr_manager.sdata.profile[attribute].values[val] = {
                    cnt:cnt, 
                    selected:0,
                    display:true,
                    haveit:haveit, 
                    matches:{},
                    new:newval,
                };
            }
            this.last_fetched = attribute;
        }
        clb();
    });
},

fetch_location: function(clb) {
    // I should get all possible keys from the satellite,
    // let's fix it to "my location" for now.
    key = "my location";
    $.getJSON(E.satellite.url+"/location/fetch/"+E.agent.id+"/"+key, function(json){
        val = {lat:json.lat, lon:json.lon};
        valstr = JSON.stringify(val);
        key = "my location";
        attr_manager.add_sdata("location", key, 0);
        
        if (json.lat.length && json.lon.length) {
            
            geoclb = function(val, results, formatted) {
                console.log("geoclb:", val, results, formatted);
                
                cap = "location";
                key = "my location";
                oldval = {lat:""+json.lat,lon:""+json.lon};
                oldval = JSON.stringify(oldval);
                
                
                this.post_keyval(cap, key, val, function(json){
                    console.log("saving new location:", json.error);
                });
                clb();
                console.log("finish  location");
            }
            
            if (E.agent.id in cookies.get_cookie().pseudonyms) {
                this.get_geolocation(geoclb);
            } else {
                latlng = new google.maps.LatLng(json.lat, json.lon);
                this.get_geocode(latlng, function(){
                    clb();
                    console.log("finish  location");
                });
            }
        } else {
            attr_manager.sdata.location[key].values[valstr] = {
                cnt:json.count, 
                selected:0, 
                display:true, 
                haveit:false, 
                matches:json.matches,
            };
            clb();
        }
    });
},

update_monitor: function() {
    if (window.location.search == "?control") {
        data = JSON.stringify(this.match_criteria);
        $.post(E.agent.baseurl+"/controller", {data:data, controller:E.agent.id}, function(json){
            console.log("controller post:", json);
        }, "json");
    };
    return false;
},

get_val_input_boxes: function() {
    return $("input[cap=\"profile\"]");
},

show_all_keyvals: function() {
    $("div.valcontainer").show();
    $("pill").show();
},

nav_search: function(){
    this.show_all_keyvals();
    $("#message").hide();
    if ("{{config.secret}}".length)
        this.get_val_input_boxes().show();
},

nav_new: function(){
    this.show_all_keyvals();
    $("div.valcontainer[new!=\"true\"]").hide();
    $("pill[new!=\"true\"]").hide();
    
    $("#message").hide();
    if ($("pill[new=\"true\"]").length == 0) {
        alert = $("<div class='alert-message warning fade in' data-alert='alert'><a class='close' href='#'>&times;</a><p>Nothing new yet.<br>Why not add something new about you?</p></div>")
        alert.alert();
        $("#message").show().html(alert);
    }
    
    this.get_val_input_boxes().hide();
    this.post_visited_keyval("all");
},

nav_me: function(){
    this.show_all_keyvals();
    $("div.valcontainer[me!=\"true\"]").hide();
    $("pill[me!=\"true\"]").hide();
    
    $("#message").hide();
    if ($("pill:visible").length == 0) {
        alert = $("<div class='alert-message warning fade in' data-alert='alert'><a class='close' href='#'>&times;</a><p>Your profile is empty.<br>Try typing an attribute below, or go to the \"search\" tab to add from existing ones.</p></div>")
        alert.alert();
        $("#message").show().html(alert);
    }
    
    if ("{{config.secret}}".length)
        this.get_val_input_boxes().show();
},

};

return attr_manager;
});