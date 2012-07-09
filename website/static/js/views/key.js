define([
    'jquery', 
    'underscore', 
    'backbone',
    'scroll',

    'text!templates/key.html',
], function($, _, Backbone, scroll, keyTemplate){
    var KeyView = Backbone.View.extend({

    // tagName: 'attribute',
    template: _.template(keyTemplate),

    events: {
        'click a': 'keyClick',
        // 'submit form': 'submitNewValue',
    },

    keyClick: function(){
        $('aside > div > a').removeClass('highlighted');
        this.$('a').addClass('highlighted');
        return false;
    },

    initialize: function(options) {
      _.bindAll(this, 'render');
      
      // this.model.bind('destroy', this.remove);
      // this.model.view = this;
    },

    render: function(model) {
        // html = this.template(this.model.toJSON());
        html = this.template(model);
        $(this.el).html(html);
        return this;
    },

    });
    return KeyView;
});