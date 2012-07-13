define([
    'jquery', 
    'underscore', 
    'backbone',
    'scroll',

    'text!templates/key.html',
], function($, _, Backbone, scroll, keyTemplate){
    var KeyView = Backbone.View.extend({

    className: 'asideEntry',
    // tagName: 'attribute',
    template: _.template(keyTemplate),

    events: {
        'click a': 'keyClick',
        // 'submit form': 'submitNewValue',
    },

    keyClick: function(){
        $('aside > div > a').removeClass('highlighted');
        $('aside > div > a > i').removeClass('icon-white');
        this.$('a').addClass('highlighted');
        this.$('i').addClass('icon-white');
        
        this.keyClickClb && this.keyClickClb(this.model)
        return false;
    },

    initialize: function(options) {
      _.bindAll(this, 'render');
      this.keyClickClb = options.keyClickClb;
      // this.model.bind('destroy', this.remove);
      // this.model.view = this;
    },

    render: function(model) {
        // html = this.template(this.model.toJSON());
        this.model = model;
        var icon = 'icon-font';
        if (model.type == 'location')
            icon = 'icon-map-marker';

        html = this.template({title: model.key, icon:icon});
        $(this.el).html(html);
        return this;
    },

    });
    return KeyView;
});