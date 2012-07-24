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
        return false;
    },
    login: function(e){ 
        var btn;
        if (e) {
            btn = $(e.target);
            e.stopPropagation();
        } else
            btn = this.$('a#signin');

        if (btn.hasClass('highlighted')) {
            btn.removeClass('highlighted');
            this.app.loginView.close();
            return;
        }
        $('a').removeClass('highlighted');
        btn.addClass('highlighted')

        var action = btn.attr('id');
        this.trigger(action, action);
        return false;
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
        _.bindAll(this, 'render', 'login');
        $(this.el).html(this.template());
    },
  });
  return navView;
});
