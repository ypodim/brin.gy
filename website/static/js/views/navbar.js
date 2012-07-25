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
        'click a#feedback': 'feedback',
        'click a#contexts': 'contextMenu',
    },
    template: _.template(navbarTemplate),
    
    app: appConfig.getState(),

    contextMenu: function(e){
        var btn;
        btn = $(e.target);
        e.stopPropagation();

        if (btn.hasClass('highlighted')) {
            btn.removeClass('highlighted');
            this.app.loginView.close();
            return;
        }
        $('a').removeClass('highlighted');
        btn.addClass('highlighted')

        var action = btn.attr('id');
        var left = $(e.target).offset().left;
        var width = $(e.target).width();
        this.trigger(action, {action:action, left:left, width:width});
        return false;
    },
    feedback: function(){
        this.app.modal.render({title:'feedback'});
        return false;
    },
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
        var left = btn.offset().left;
        var width = btn.width();
        this.trigger(action, {action:action, left:left, width:width});
        return false;
    },

    account: function(){
        // var left = $(e.target).offset().left;
        // var width = $(e.target).width();
        this.trigger('account', {action:'account'});
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
