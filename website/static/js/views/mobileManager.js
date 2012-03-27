
define([
    'jquery',
    'underscore', 
    'backbone',

    'order!button',
    'alerts',
    'modal',
    'order!twipsy',
    'order!popover',

    // 'common/ego_website',
    // 'common/setup_modals',
    // 'common/attr_manager',

    'text!templates/mobileManage.html',

    'views/key',
    'views/value',
    'views/valueDetailed',

    'collections/keys',
    'collections/values',
    
    'models/key',
    'models/value',
    'models/attribute',
    ], function(
        $, _, Backbone, 
        button, alerts, modal, popover, twipsy, 
        // common, modals, attr_manager, 
        manageViewTemplate, 

        keyView, valueView, valueDetailedView,
        Keys, Values,
        kModel, vModel, attrModel){
  var managerView = Backbone.View.extend({
    el: $("#container"),
    template: _.template(manageViewTemplate),
    events: {
        // "search #searchinput": "searchAttributes",
        // "keyup #searchinput": "searchAttributes",
        "click div.controls > button": "newAttributeModal",
        // "click .cancel-btn": "cancelBtn",
        // "submit #searchbox": "submitNewAttribute", 
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

    _keysInserted: {},
    _keyViews: {},

    addOneAttribute: function(model) {
        var key = model.get('key');
        var val = model.get('val');
        var kcnt = model.get('kcnt');
        var vcnt = model.get('vcnt');
        var haveit = model.get('haveit');
        var newval = model.get('newval');

        if (!(key in this._keysInserted)) {
            this._keysInserted[key] = {};
            // console.log('inserted', key);

            kmodel = new kModel({
                key:key,
                cnt:kcnt,
            });
            var kv = new keyView({
                model : kmodel,
            });
            this.$('#m-choices').append($(kv.render().el));

            this._keyViews[key] = kv;
        }

        // vmodel = new vModel({
        //     key:key,
        //     val:val,
        //     cnt:vcnt,
        // });
        var vvdetailed = new valueDetailedView({
            model : model,
            // state : this.state,
        });
        this._keyViews[key].$('.valpartdetailed').append(vvdetailed.render().el);
    },


    initialize: function(options) {
        _.bindAll(this, 'addOneAttribute', 'render');
        
        // this.attrCollection = new Attributes();
        options.attrCollection.bind('add', this.addOneAttribute);
        this.state = options.state;

        $(this.el).append(this.template());
    },
    
    render: function(){
        // console.log("manager view rendered");
    },
  });
  return managerView;
});
