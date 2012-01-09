define([
  // These are path alias that we configured in our bootstrap
  'jquery',     // lib/jquery/jquery
  'underscore', // lib/underscore/underscore
  'backbone',   // lib/backbone/backbone
  'alerts',
  'modal',
  'order!twipsy',
  'order!popover',
  
], function($, _, Backbone, alerts, modal, popover, twipsy){
  // Above we have passed in jQuery, Underscore and Backbone
  // They will not be accesible in the global scope
modals = {
init_new_key_modal: function() {
    mdl = $("#new-key-modal");
    mdl.modal({backdrop:"static", keyboard:true});
    mdl.bind('shown', function(){
        searchterm = $("#searchinput").val();
        if (searchterm.length) {
            terms = searchterm.split(" ");
            $(".keypart-override > span > input").val(terms[0]);
            if (terms.length > 1) 
                $(".valpart-override div:nth-child(1) > a > span.value > input").val(terms[1]);
            // console.log("from SEARCHBOX:", searchterm, terms);
        }
        $("#searchinput").val("").keyup();
        $("#message").hide();
    });
    
    $("#new-key-btn").click(function(){
        key = $(".keypart-override > span > input").val();
        vals = [];
        val = $(".valpart-override div:nth-child(1) > a > span.value > input").val();
        if (val.length) vals.push(val);
        val = $(".valpart-override div:nth-child(2) > a > span.value > input").val();
        if (val.length) vals.push(val);
        val = $(".valpart-override div:nth-child(3) > a > span.value > input").val();
        if (val.length) vals.push(val);
        
        $(this).parent().parent().modal("hide");
        
        counter = 0;
        clb = function(){
            counter++;
            if (counter == vals.length) {
                console.log("posted ALL");
                E.last_fetched = "";
                E.fetch_initial_info(E.populate_attrs);
            }   
        }
        for (i in vals) {
            E.post_keyval("profile", key, vals[i], clb);
        }
        return false;
    });
},

init_admin_url_modal: function() {
    $("#spinning-icon").hide();
    mdl = $("#admin-url-modal");
    mdl.modal({backdrop:"static", keyboard:true});
    
    $("#admin-url-email").keyup(function(obj){
        value = $(this).val();
        var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        if (filter.test(value))
            $("#admin-url-send-btn").removeClass("disabled");
        else
            $("#admin-url-send-btn").addClass("disabled");
            
        if (obj.keyCode == 13 && filter.test(value))
            $("#admin-url-send-btn").click();
    });
    $("#admin-url-send-btn").click(function(){
        that = this;
        if ($(this).hasClass("disabled")) return false;
        secret = cookies.get_cookie().pseudonyms[E.agent.id];
        email = $("#admin-url-email").val();
        data = {secret:secret, to:email, user:E.agent.id};
        var r = document.cookie.match("\\b_xsrf=([^;]*)\\b");
        data._xsrf = r ? r[1] : undefined;
        '{{ xsrf_form_html() }}';
        $.post("/message", data, function(json){
            if (json.error)
                console.log("message got back", json);
            $("#admin-url-modal").modal("hide");
        }, "json");
        $("#spinning-icon").show();
    });
},

init_delete_modal: function() {
    mdl = $("#delete-confirmation-modal");
    mdl.modal({backdrop:"static", keyboard:true});
    
    $("#delete-delete-btn").click(function(){
        that = this;
        secret = cookies.get_cookie().pseudonyms[E.agent.id];
        console.log("deleting", E.agent.url, secret);
        $.ajax({
            url: E.agent.url,
            type: "DELETE",
            data: {secret:secret},
            success: function(json) {
                if (json.error.length) {
                    $(that).parent().parent().modal("hide");
                    alert(json.error);
                } else {
                    cookies.del_cookie(E.agent.id);
                    location.replace(E.website_url);
                }
            },
            dataType: "json",
        });
    });
},

init_getlocation_modal: function() {
    mdl = $("#get-location-modal");
    mdl.modal({backdrop:"static", keyboard:true});
    
    $("#location-ok-btn").click(function(){
        geoclb = function(val, results, formatted) {
            console.log("geoclb:", val, results, formatted);
            cap = "location";
            key = "my location";
            button = $("span.add_btn[cap='"+cap+"'][key='"+key+"']");
            button.attr("val", val);
            button.siblings().children("span.value").html(formatted);
            E.complete_toggle_handle(cap, key, val, button);
        }
        
        E.get_geolocation(geoclb);
        mdl.modal("hide");
    });
},

initialize: function() {
    this.init_new_key_modal();
    this.init_admin_url_modal();
    this.init_delete_modal();
    this.init_getlocation_modal();
},
};

return modals;
});