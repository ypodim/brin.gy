define([
    'jquery', 
    'underscore', 
    'backbone',
    'scroll',

    'models/key',
    'models/attribute',
    'views/key',
    'views/valueDetailed',

    'text!templates/newAttribute.html',
], function($, _, Backbone, scroll, 
    kModel, attrModel, keyView, valueDetailedView,
    profileTemplate){
    var newAttrView = Backbone.View.extend({

    tagName: 'newattribute',
    // el: $("#container"),
    template: _.template(profileTemplate),

    events: {
        // 'click #includeBtn': 'includeBtn',
        // 'click #moreBtn': 'moreBtn',
        'keypress input': 'valueKey',
    },

    save: function(){
        var key = this.$('input#title').val();
        if (key.length == 0)
            return false;

        var that = this;
        var saved = false;
        this.$('input.value').each(function(i, obj){

            if ($(obj).val().length > 0) {
                var val = $(obj).val();
                console.log('adding', i, key, val);

                that.state.mutateKeyValue(key, val, 'POST', function(json){
                    var attr = new attrModel({
                        key:key,
                        val:val,
                        kcnt:1, 
                        vcnt:1, 
                        selected:false,
                        display:true,
                        haveit:true, 
                        matches:{},
                        new:false,
                    });
                    attr.bind('change', that.state.attrCollection.modelChange)
                    that.state.attrCollection.add(attr);
                });
                saved = true;
            }
            if (saved && i > 1)
                that.state.router.navigate('#', {trigger:true});
        });
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'save');
        this.state = options.state;
        $('button#saveAttrBtn').one('click', this.save);
    },

    valueKey: function(evt){
        if ($(evt.target).hasClass('value') && $(evt.target).val().length > 19)
            return false;
        if ($(evt.target).val().length > 22)
            return false;

        if (evt.keyCode == 32 || evt.keyCode == 13 ||(evt.keyCode >= 45 && evt.keyCode <= 126))
            return true;
        return false;
    },

    render: function() {
        html = this.template({username:this.username});
        $(this.el).html(html);
        $("#container").html(this.el);
        this.$('input#title').focus();
        return this;
    },

    });
    return newAttrView;
});