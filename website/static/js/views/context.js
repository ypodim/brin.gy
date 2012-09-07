define([
    'jquery', 
    'underscore', 
    'backbone',
    'scroll',

    'text!templates/context.html',
], function($, _, Backbone, scroll, contextTemplate){
    var ContextView = Backbone.View.extend({

    className: 'asideEntry',
    // tagName: 'attribute',
    template: _.template(contextTemplate),

    events: {
        'click a.asideKey': 'keyClick',
    },

    keyClick: function(){
        this.trigger('appclick', this.model);
        this.$('a').addClass('highlighted');
        // this.$('i').addClass('icon-white');
        return false;
    },

    initialize: function(options) {
      _.bindAll(this, 'render');
    },

    render: function(options) {
        // var icon = 'icon-font';
        // if (this.model.get('type') == 'location')
        //     icon = 'icon-map-marker';
        // if (this.model.get('type') == 'users')
        //     icon = 'icon-user';
        // this.model.set({icon:icon});

        this.$el.html(this.template(this.model.toJSON()));

        return this;
    },

    });
    return ContextView;
});