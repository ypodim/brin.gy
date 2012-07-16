define([
  'jquery',
  'underscore', 
  'backbone',
  'router',

  'text!templates/navbar.html'
  ], function($, _, Backbone, router, navbarTemplate){
  var navView = Backbone.View.extend({
    el: $('#navbar'),
    events: {
        // 'click button#addLocation': 'addLocation',
        // 'click a#about': 'about',
        'click a#signin': 'signin',
        'click a#signup': 'signup',

    },
    template: _.template(navbarTemplate),

    signin: function(){ this.trigger('signin') },
    signup: function(){ this.trigger('signup') },

    render: function(){
        // $('.navbar a.context').show().html('#'+APP.context.name);

        this.$('a.context').show().html('#'+APP.context.name);
        // this.$('.authed').hide();
        // this.$('.noauth').hide();

        if (APP.user) {
            this.$('.authed').show();
        } else {
            this.$('.noauth').show();
        }
    },

    initialize: function(options){
        _.bindAll(this, 'render');
        $(this.el).html(this.template());
    },
  });
  return navView;
});
