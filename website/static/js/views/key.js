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
        'click a.asideKey': 'keyClick',
    },

    keyClick: function(){
        this.trigger('keyclick', this.model);
        this.$('a').addClass('highlighted');
        this.$('i').addClass('icon-white');
        return false;
    },

    initialize: function(options) {
      _.bindAll(this, 'render');
    },

    render: function(options) {
        var icon = 'icon-font';
        if (this.model.get('type') == 'location')
            icon = 'icon-map-marker';
        if (this.model.get('type') == 'users')
            icon = 'icon-user';
        this.model.set({icon:icon});

        this.$el.html(this.template(this.model.toJSON()));

        if (options && options.newKey) {
            this.$('a.asideKey').hide();
            return;
        } else 
            this.$('form.newKey').hide();


        return this;
    },

    });
    return KeyView;
});