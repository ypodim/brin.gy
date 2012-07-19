define([
    'jquery', 
    'underscore', 
    'backbone',
    'scroll',

    'models/attribute',
    'views/key',
    'views/valueDetailed',

    'text!templates/newAttribute.html',
], function($, _, Backbone, scroll, 
    kModel, attrModel, valueDetailedView,
    profileTemplate){
    var newAttrView = Backbone.View.extend({

    tagName: 'newattribute',
    template: _.template(profileTemplate),

    events: {
        'keypress input': 'valueKey',
        'keyup input': 'autocomplete',
        'submit form': 'next',
    },

    save: function(){
        var context = this.context;
        var key = this.key;

        var that = this;
        var saved = false;
        this.$('input.value').each(function(i, obj){

            if ($(obj).val().length > 0) {
                var val = $(obj).val();
                console.log('adding', i, context, key, val);

                that.state.mutateKeyValue({key:key, val:val, clb:function(json){
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
                    that.state.router.navigate('#/c/'+that.state.context.name, {trigger:true});
                }});
                saved = true;
                
            }
            // if (saved) {
                // that.state.router.navigate('#/all', {trigger:true});
                // console.log('saved', i)
            // }
        });
    },
    next:function(){
        if (this.key) {
            this.save();
        } else {
            var key = this.$('input#title').val();
            var frag = '#/new/'+this.context+'/'+key;
            this.state.router.navigate(frag, {trigger:true});
        }
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'save');
        this.state = options.state;
        this.context = options.context;
        this.key = options.key;
        this.val = options.val;
    },

    autocomplete: function(evt) {
        var text = $(evt.target).val();
        var regex = new RegExp(text, 'i');
        var matches = [];
        this.$('#autocomplete').empty();

        var url = this.state.satellite.url+'/profile/all/keys';
        if (this.key)
            url = this.state.satellite.url+'/profile/all/key/'+this.key+'/values';

        var that = this;
        $.getJSON(url, function(json){
            for (var i in json.items) {
                k = json.items[i][0];
                if (k.match(regex))
                    matches.push(k);
            }
            that.$('#suggestions > label').hide();
            _.each(matches, function(entry){
                that.$('#suggestions > label').show();

                var html = $('<a></a>').addClass('suggestion');
                html.html(entry);
                html.click(function(){
                    that.$('.suggestion').css('background-color','inherit');
                    $(this).css('background-color','#aaa');
                    $(evt.target).val($(this).html()).focus();
                    return false;
                });
                this.$('#autocomplete').append(html);
            });
        });
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
        var html = this.template({key:this.key});
        $(this.el).html(html);
        $("#container").html(this.el);

        if (! this.key) {
            this.$('form.key').show();
            this.$('input#title').focus();
        } else 
            if (this.val == undefined) {
                this.$('form.val').show();
                this.$('input.value:first').focus();
            }        
        return this;
    },

    });
    return newAttrView;
});












