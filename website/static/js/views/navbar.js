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
    contextMenuClicked: false,

    contextMenu: function(e){
        if (this.contextMenuClicked)
            return false;

        this.trigger('contexts');
        this.contextMenuClicked = true;

        $(e.target).addClass('disabled');
        return false;

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
    enableContextMenu: function(){
        this.$('a').removeClass('disabled');
        this.contextMenuClicked = false;
    },
    feedback: function(){
        this.app.modal.render({title:'feedback'});
        return false;
    },
    about: function(){
        this.trigger('about');
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
        // $('.navbar a.context').show().html('#'+app.context.title);
        this.$('a').removeClass('highlighted');

        var context = this.app.getContext();
        if (context) 
            this.$('a.context').show().html('#'+context.title);
        else
            this.$('a.context').hide();
        // var ctitle = (context) ? context.title : 'fae skata';
        // this.$('a.context').show().html('#'+ctitle);

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
