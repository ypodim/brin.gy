define([
    'jquery', 
    'underscore', 
    'backbone',
    'scroll',

    'models/attribute',

    'views/valueDetailed',
    'text!templates/key.html',
], function($, _, Backbone, scroll, Attr, valueDetailedView, keyTemplate){
    var KeyView = Backbone.View.extend({

    tagName: 'attribute',
    template: _.template(keyTemplate),
    detailViewRendered: false,

    events: {
        'click a.keypart': 'sink',
        'keypress input': 'valueKey',
        // 'submit form': 'submitNewValue',
        'click div.valpartfooter > button': 'addBtn',
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'valueKey', 'submitNewValue');
      this.model.bind('change', this.render);
      this.state = options.state;
      // this.model.bind('destroy', this.remove);
      this.model.view = this;
    },

    render: function() {
        html = this.template(this.model.toJSON());
        $(this.el).html(html);
        return this;
    },

    valueKey: function(evt){
        if (evt.keyCode == 32 || evt.keyCode == 13 ||(evt.keyCode >= 45 && evt.keyCode <= 126))
            return true;
        return false;
    },

    addBtn: function(){
        frag = '#/new/'+this.state.context.name+'/'+this.model.get('key');
        console.log(frag);
        this.state.router.navigate(frag, {trigger:true});
    },
    submitNewValue: function() {
        
        var key = this.model.get('key');
        var val = this.$('input').val();
        if (val.length == 0)
            return false;

        var type = 'POST';
        var that = this;
        console.log('posting', key, val, type);
        this.state.mutateKeyValue({key:key, val:val, type:type, clb:function(json){
            console.log(json);
            this.$('input').val('');

            var attr = new Attr({
                key:key,
                val:val,
                kcnt:0, 
                vcnt:1, 
                selected:false,
                display:true,
                haveit:true, 
                matches:{},
                new:false,
            });
            attr.bind('change', that.state.attrCollection.modelChange)
            that.state.attrCollection.add(attr);
        }});
        
        return false;
    },

    sink: function(){ return false; },
    });
    return KeyView;
});