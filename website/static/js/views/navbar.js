define([
  'jquery',
  'underscore', 
  'backbone',
  'app',

  'text!templates/navbar.html'
  ], function($, _, Backbone, appConfig, navbarTemplate){
  var navView = Backbone.View.extend({
    el: $('#navbar'),
    events: {
        'click a#about': 'about',
        'click a#signin': 'login',
        'click a#signup': 'login',
        'click a#account': 'account',
        'click a#explore': 'explore',
        'click a#contexts': 'contextMenu',
        'click a.context': 'contextTitle',
    },
    template: _.template(navbarTemplate),
    
    app: appConfig.getState(),
    contextMenuClicked: false,
    

    contextTitle: function(){
        this.trigger('context:title');
        return false;
    },
    contextMenu: function(e){
        if (this.contextMenuClicked)
            return false;
        else
            return true;

        this.trigger('contexts');
        this.contextMenuClicked = true;

        this.$('a#contexts').addClass('disabled');
        return false;

        var btn;
        btn = $(e.target);
        e.stopPropagation();

        if (btn.hasClass('highlighted')) {
            btn.removeClass('highlighted');
            this.app.loginView.close();
            return false;
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
    
    about: function(e){
        // this.trigger('about');
        // return false;

        var btn;
        btn = $(e.target);
        e.stopPropagation();

        if (btn.hasClass('highlighted')) {
            btn.removeClass('highlighted');
            this.app.loginView.close();
            return false;
        }
        $('a').removeClass('highlighted');
        btn.addClass('highlighted')

        var action = btn.attr('id');
        var left = $(e.target).offset().left;
        var width = $(e.target).width();
        this.trigger(action, {action:action, left:left, width:width});
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
            return false;
        }
        $('a').removeClass('highlighted');
        btn.addClass('highlighted')

        var action = btn.attr('id');
        var left = btn.offset().left;
        var width = btn.width();
        this.trigger(action, {action:action, left:left, width:width});
        return false;
    },

    account: function(e){
        var btn = this.$('a#account');

        e.stopPropagation();

        if (btn.hasClass('highlighted')) {
            btn.removeClass('highlighted');
            this.app.loginView.close();
            return false;
        }
        $('a').removeClass('highlighted');
        btn.addClass('highlighted')

        var action = btn.attr('id');
        var left = btn.offset().left + 22;
        var width = btn.width();
        this.trigger(action, {action:action, left:left, width:width, alerts:this.alerts});
        return false;
    },

    toggleContextTitle: function(options){
        var flag = (options && options.flag);
        this.$('a.context').toggle(flag);
    },

    explore: function(){
        if (this.explorerRunning) {
            history.back();
            this.explorerRunning = undefined;
            this.render();
            return false;
        }
        this.explorerRunning = 1;
        this.render();
    },

    alertPoller: function() {
        if (!this.app.agent.loggedIn()) {
            this.timer = undefined;
            return;
        }
        var that = this;
        this.app.agent.loadUserOptions(function(json){
            that.alerts = (json.alerts) ? json.alerts.length : 0;
            that.$('.badge-icon').html(that.alerts).toggle((that.alerts>0));
            that.app.trigger('alerts:update', that.alerts);
            that.timer = setTimeout(function(){that.alertPoller()}, 1000);
        });
    },

    render: function(options){
        if (this.timer == undefined)
            this.alertPoller();

        this.$('li:not(.explore)').toggle(!this.explorerRunning);
        this.$('li.explore > a').html('Explore');
        if (this.explorerRunning) {
            this.$('li.explore > a').html('Back');
            return;
        }

        this.$('li.menu').show();
        this.$('a').removeClass('highlighted');

        var ctitle = this.app.context().title;
        this.$('a.context').toggle((ctitle!=null)).html('#'+ctitle);
        this.$('a.context').attr({href: '#/c/'+this.app.context().id});
        console.log(ctitle, this.app.context().id)
        
        this.$('.authed').toggle(this.app.agent.loggedIn());
        this.$('.noauth').toggle(!this.app.agent.loggedIn());
        this.$('#username').html(this.app.agent.id());
    },

    initialize: function(options){
        _.bindAll(this, 'render', 'login');
        $(this.el).html(this.template());
    },
  });
  return navView;
});
