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
        // 'click a#feedback': 'feedback',
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
    // feedback: function(){
    //     this.app.modal.render({title:'feedback'});
    //     return false;
    // },
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
        // this.trigger('account', {action:'account'});
        // return false;

        var btn;
        // btn = $(e.target);
        btn = this.$('a#account');

        e.stopPropagation();

        if (btn.hasClass('highlighted')) {
            btn.removeClass('highlighted');
            this.app.loginView.close();
            return false;
        }
        $('a').removeClass('highlighted');
        btn.addClass('highlighted')

        var action = btn.attr('id');
        var left = this.$('span#username').offset().left;
        var width = this.$('span#username').width();
        this.trigger(action, {action:action, left:left, width:width});
        console.log('account trigger', action)
        return false;
    },

    toggleContextTitle: function(options){
        var flag = (options && options.flag);
        this.$('a.context').toggle(flag);
    },

    render: function(options){
        if (options && options.message) {
            this.$('li.menu').hide();
            this.$('li.message').show();
            this.$('li.message').html(options.message);
            return false;
        }

        this.$('li.menu').show();
        this.$('li.message').hide();
        this.$('a').removeClass('highlighted');

        var ctitle = this.app.getContext().title;
        this.$('a.context').toggle((ctitle!=null)).html('#'+ctitle);
        
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
