define([
  'jquery',
  'underscore', 
  'backbone',
  'app',
  'router',

  'text!templates/navbar.html'
  ], function($, _, Backbone, appConfig, router, navbarTemplate){
  var navView = Backbone.View.extend({
    el: $('#navbar'),
    events: {
        'click a#about': 'about',
        'click a#signin': 'login',
        'click a#signup': 'login',
        'click a#account': 'account',
    },
    template: _.template(navbarTemplate),
    
    app: appConfig.getState(),

    about: function(){
        console.log(this.app);
        return false;
    },
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
        // $('.navbar a.context').show().html('#'+app.context.name);
        this.$('a').removeClass('highlighted');

        this.$('a.context').show().html('#'+this.app.context.name);
        // this.$('.authed').hide();
        // this.$('.noauth').hide();

        if (this.app.agent.loggedIn()) {
            this.$('.authed').show();
            this.$('.noauth').hide();
            this.$('#username').html(this.app.agent.id());
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
