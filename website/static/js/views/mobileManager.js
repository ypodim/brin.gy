
define([
    'jquery',
    'underscore', 
    'backbone',

    'alerts',
    'modal',
    'order!twipsy',
    'order!popover',

    'common/ego_website',
    'common/setup_modals',
    'common/attr_manager',

    'text!templates/mobileManage.html',

    'views/keyCollection',
    // 'views/value',

    'collections/keys',
    'collections/values',
    ], function(
        $, _, Backbone, 
        alerts, modal, popover, twipsy, 
        common, modals, attr_manager, 
        manageViewTemplate, 
        KeysView,
        Keys, Values){
  var managerView = Backbone.View.extend({
    el: $("#container"),
    events: {
        "click #clear-filters-btn": "clearFilters",
        "click nav > a": "navFilter",
        "search #searchinput": "searchAttributes",
        "keyup #searchinput": "searchAttributes",
        "click div.controls > button": "newAttributeModal",
        "click .cancel-btn": "cancelBtn",
        "submit #searchbox": "submitNewAttribute", 
    },
    submitNewAttribute: function(){
        return false;
        
        searchinput = $(this).children("input");
        newkey = searchinput.val();
        if (newkey in attr_manager.sdata.profile) {
            $("#searchinput").popover("hide");
            $(".editor").children().focus();
        } else {
            searchinput.popover("hide").val("").attr("key","");
            attr_manager.show_keyvals();
            attr_manager.populate_attrs(true);
            
            cap = "profile";
            attr_manager.add_sdata(cap, newkey, 0);
            
            keypart = attr_manager.generate_key_entry(cap, newkey);
            editor = attr_manager.generate_val_entry_editor(newkey);
            valpart = $("<div class='valpart'></div>").append(editor);
            
            pill = $("<pill></pill>").append(keypart).append(valpart);
            $("#m-choices").children("div:first-child").prepend(pill);
            editor.children("input").focus();
        }
        return false;
    },
    cancelBtn: function(){ 
        $(this).parent().parent().modal("hide");
    },
    newAttributeModal: function() { 
        // $("#new-key-modal").modal("show");
        cnt = Math.floor(Math.random()*11);
        console.log(Keys.models[0].set({cnt:cnt}));
    },
    searchAttributes: function(){
        text = $(this).val();
        attr_manager.show_keyvals();
        
        if (text.length == 1) {
            return true;
        }
        
        attr_manager.get_val_input_boxes().hide();
        
        matches = text.split(' ');
        rexpr = "";
        for (i in matches) {
            if (matches[i].length == 0)
                continue;
            if (i>0)
                rexpr += "|";
            rexpr += matches[i];
        }
        re = new RegExp(rexpr, 'i');
        
        no_match_at_all = true;
        for (cap in attr_manager.sdata)
            for (key in attr_manager.sdata[cap]) {
                if (key.match(re)) {
                    attr_manager.sdata[cap][key].display = true;
                    no_match_at_all = false;
                } else {
                    no_vmatch = true;
                
                    for (val in attr_manager.sdata[cap][key].values) {
                        if (val.match(re)) {
                            attr_manager.sdata[cap][key].values[val].display = true;
                            no_vmatch = false;
                            no_match_at_all = false;
                        } else {
                            attr_manager.sdata[cap][key].values[val].display = false;
                        } 
                    }
                    
                    if (no_vmatch)
                        attr_manager.sdata[cap][key].display = false;
                }
            }
        
        if (no_match_at_all) {            
            msg = $("<div class='message'></div>").html("No results found.");
            btn = $("<div class='btn danger'></div>").html("add \""+text+"\" to the system");
            btn.click(function() { 
                $("#new-key-modal").modal("show");
            });
            $("#message").show().html(msg).append(btn);
            $(".controls").hide();
        } else {
            $("#message").hide();
            $(".controls").show();
        }
            
    
        attr_manager.populate_attrs();
    },
    navFilter: function (){
        $("nav > a").removeClass("selected");
        $(this).addClass("selected");
        if ($(this).html() == "all") attr_manager.nav_search();
        if ($(this).html() == "unseen") attr_manager.nav_new();
        if ($(this).html() == "me") attr_manager.nav_me();
        return false;
    },
    clearFilters: function(){
        $(".filter-item").each(function(){
            $(this).children("a.closebtn").click();
        });
        return false;
    },



    addOneKey: function(key) {
        var view = new keyView({model: key});
        html = view.render().el;
        this.$("#m-choices").append(html);
        // console.log("add KEY model", this.$("#choices"), html, key.view);
    },

    addOneValue: function(value) {
        key = value.get('key');
        kmodel = Keys.getKey(key);
        valplaceholder = kmodel[0].view.$('div.valpart');
        // valplaceholder.html('yyyyy')
        
        var view = new valueView({model: value});
        html = view.render().el;
        // console.log(valplaceholder, html, value.get('val'));
        valplaceholder.append( html );


    },

    // Add all items in the **Todos** collection at once.
    addAllValues: function() {
        Values.each(this.addOneValue);
    },

    keysView: null,
    initialize: function() {
        _.bindAll(this, 'addAllValues', 'render');

        // Values.bind('add',     this.addOneValue);
        // Values.bind('reset',   this.addAllValues);



        var that = this;
        url = require.E.satellite.url+"/profile/"+require.E.context.context+"/keyvals";
        $.getJSON(url, function(json){
            console.log("got items", json.items.length)
            for (i in json.items) {
                attribute = json.items[i].key;
                score = json.items[i].score;

                Keys.add({
                    key:attribute,
                    cnt:score, 
                    selected:false,
                    display:true, 
                    matches:{},
                    // values: values,
                });

                values = {};
                // attr_manager.add_sdata("profile", attribute, 0);
                for (j in json.items[i].values) {
                    val = json.items[i].values[j].val;
                    cnt = json.items[i].values[j].score;
                    haveit = (json.items[i].values[j].userhasit==1);
                    newval = true;
    
                    Values.add([{
                        key:attribute,
                        val:val,
                        cnt:cnt, 
                        selected:false,
                        display:true,
                        haveit:haveit, 
                        matches:{},
                        new:newval,
                    }]);
                }
            }
            console.log("data received in collection");
            keysView = new KeysView({collection:Keys});

            var compiled_template = _.template( manageViewTemplate );
            that.el.html( compiled_template() );

            $('#m-choices').html( $(keysView.el).children() );
        });
        
        // Values.initialize();
        // attr_manager.initialize();

        // clb = attr_manager.populate_attrs;
        // attr_manager.fetch_initial_info(clb);
        
        // console.log("SECRET", "{{config.secret}}", "{{config.secret}}");
        // if ("{{config.secret}}".length)
        //     common.cookies.set_cookie("{{config.agentid}}", "{{config.secret}}");
        // else
        //     attr_manager.get_val_input_boxes().hide();
        
        // setInterval(attr_manager.poll_matches, 2000); 
        
        $("#context-title").html("# "+require.E.context.context);
        $("#pseudonym").show();
        
        // common.mapman.initialize();
        
        attr_manager.tabindex = 2;
        $("#searchinput").attr("tabindex", 1).focus();
        
        
        $("#tourBtn").show();

        modals.initialize();
        
        $("#start-btn").hide();
        $("#account-btn").show();
        $("#context-btn").show();
    },
    
    render: function(){
        // console.log("manager view rendered");
    },
  });
  return managerView;
});
