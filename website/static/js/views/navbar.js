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
        'click a#signin': 'login',
        'click a#signup': 'login',

    },
    template: _.template(navbarTemplate),

    login: function(e){ 
        if ($(e.target).hasClass('highlighted')) {
            $(e.target).removeClass('highlighted');
            return;
        }
        $('a').removeClass('highlighted');
        $(e.target).addClass('highlighted')

        var action = $(e.target).attr('id');
        this.trigger(action, action);
        e.stopPropagation(); 
    },

    render: function(){
        // $('.navbar a.context').show().html('#'+APP.context.name);
        this.$('a').removeClass('highlighted');

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
