define([
    'jquery', 
    'underscore', 
    'backbone',
    'scroll',

    'models/key',
    'models/attribute',
    'views/key',
    'views/valueDetailed',

    'text!templates/profile.html',
], function($, _, Backbone, scroll, 
    kModel, attrModel, keyView, valueDetailedView,
    profileTemplate){
    var ProfileView = Backbone.View.extend({

    tagName: 'profile',
    // el: $("#container"),
    template: _.template(profileTemplate),

    events: {
        // 'click #includeBtn': 'includeBtn',
        // 'click #moreBtn': 'moreBtn',
    },
    _keysInserted: {},
    _keyViews: {},

    initialize: function(options) {
        _.bindAll(this, 'render', 'addOneAttribute');
        this.state = options.state;
        this.username = options.username;
    },

    addOneAttribute: function(keyval) {
        var key = keyval.key;
        var val = keyval.val;
        // console.log(this.username, key, val);
        if (!(key in this._keysInserted)) {
            this._keysInserted[key] = {};

            kmodel = new kModel({
                key:key,
                cnt:0,
                showControls: false,
            });
            var kv = new keyView({
                model : kmodel,
            });
            this.$('#attributes').append($(kv.render().el));
            this._keyViews[key] = kv;
        }

        var amodel = new attrModel({
            key: key,
            val: val,
            vcnt: 0,
            showControls: false,
        });
        var vvdetailed = new valueDetailedView({
            model : amodel,
            parentView: this._keyViews[key],
            state : this.state,
        });
        this._keyViews[key].$('.valpartdetailed').append(vvdetailed.render().el);
    },

    render: function() {
        html = this.template({username:this.username});
        $(this.el).html(html);
        $("#container").html(this.el);

        this._keysInserted = {};
        var that = this;
        var url = this.state.agent.baseurl+'/'+this.username+'/profile';
        $.getJSON(url, function(json){
            // console.log(json);
            for (var i in json.data)
                that.addOneAttribute(json.data[i]);
        });

        return this;
    },

    });
    return ProfileView;
});