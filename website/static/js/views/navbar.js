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
        // 'click a#about': 'about',
        'click a#signin': 'login',
        'click a#signup': 'login',
        'click a#account': 'account',
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

    account: function(){
        this.trigger('account');
        return false;
    },

    render: function(){
        // $('.navbar a.context').show().html('#'+APP.context.name);
        this.$('a').removeClass('highlighted');

        this.$('a.context').show().html('#'+APP.context.name);
        // this.$('.authed').hide();
        // this.$('.noauth').hide();

        if (APP.user) {
            this.$('.authed').show();
            this.$('.noauth').hide();
            this.$('#username').html(APP.user);
        } else {
            this.$('.noauth').show();
            this.$('.authed').hide();
        }
    },

    initialize: function(options){
        _.bindAll(this, 'render');
        $(this.el).html(this.template());
    },
  });
  return navView;
});
