define([
  'jquery',
  'underscore', 
  'backbone',
  'app',
  'tooltip',
  
  'text!templates/signin.html',
  'text!templates/signup.html',
  'text!templates/aboutMenu.html',
  'text!templates/accountMenu.html',
  ], function($, _, Backbone, appConfig, tooltip, signinTemplate, signupTemplate, aboutMenuTemplate, accountMenuTemplate){
  var loginView = Backbone.View.extend({
    el: $('#login'),
    events: {
        'click *': 'defaultClick',
        'click button': 'okBtn',
        'submit form': 'submit',
        'click a.reminder': 'reminder',

        'mouseover ul.menu > li > a': 'mouseOver',
        'mouseout ul.menu > li > a': 'mouseOut',
        'click ul.menu > li > a.about': 'aboutClick',
        'click ul.menu > li > a.account': 'accountClick',
    },
    app: appConfig.getState(),

    mouseOver: function(e){ $(e.target).children('i').removeClass('icon-white'); },
    mouseOut: function(e){ $(e.target).children('i').addClass('icon-white'); },
    aboutClick: function(e){
        var action = $(e.target).attr('id');
        this.trigger('about:'+action);
        this.close();
        return false;
    },
    accountClick: function(e){
        var action = $(e.target).attr('id');
        this.trigger('account:'+action);
        this.close();
        return false;
    },
    

    close: function(){
        this.$el.hide();
    },

    submit: function(e){
        if (this.options.action == 'signin') {
            username = this.$('input#username').val();
            password = this.$('input#password').val();
            this.app.doLogin(username, password);
            this.close();
        }
        if (this.options.action == 'signup') {
            username = this.$('input#username').val();
            email = this.$('input#email').val();

            this.$('img.loader').show();
            this.doCreate(username, email);
        }
        return false;
    },
    okBtn: function(e) {
        this.$('form').submit();
        return false;
    },
    defaultClick: function(e){
        e.stopPropagation();
    },
    reminder: function(){
        this.trigger('reminder');
        return false;
    },
    
    isValidEmail: function(username) {
        var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        return filter.test(username);
    },

    doCreate: function(username, email) {
        var that = this;
        if (! this.isValidEmail(email)) {
            $('div.alert')
                .removeClass('alert-success')
                .addClass('alert-error')
                .html('Invalid email address.')
                .slideDown();
            setTimeout(function(){
                $('div.alert').fadeOut();
            }, 3000);
            return false;
        }

        this.app.doCreate(username, email);
        return false;
    },
    
    render: function(options){
        var compiled_template;
        this.options = options;
        if (options==undefined)
            options = {action:'signup'};

        if (options.action == 'signup') {
            var compiled_template = _.template( signupTemplate );
            this.$el.html( compiled_template() );
            var left = options.left - this.$el.width() + options.width;
            this.$el.css({left:left}).show();
        }
        if (options.action == 'signin') {
            var compiled_template = _.template( signinTemplate );
            this.$el.html( compiled_template() );
            var left = options.left - this.$el.width() + options.width;
            this.$el.css({left:left}).show();
        }
        if (options.action=='reminder') {
            // this.el.html( compiled_template() ).show();
        }
        // if (options.action=='contexts') {
        //     var compiled_template = _.template( contextMenuTemplate );
        //     this.$el.html( compiled_template() );
        //     var left = options.left - this.$el.width() + options.width;
        //     this.$el.css({left:left}).show();
        // }
        if (options.action=='about') {
            var compiled_template = _.template( aboutMenuTemplate );
            this.$el.html( compiled_template() );
            var left = options.left - this.$el.width() + options.width;
            this.$el.css({left:left}).show();
        }
        if (options.action=='account') {
            var compiled_template = _.template( accountMenuTemplate );
            this.$el.html( compiled_template() );
            var left = options.left - this.$el.width() + options.width;
            this.$el.css({left:left}).show();
            
            this.$('#alerts').toggleClass('white-outline', (options.alerts>0));
        }
        
        this.$('form').children(':first').focus();
    },

    initialize: function(options) {
        _.bindAll(this, 'render', 'doCreate', 'submit', 'reminder');
    },
  });
  return loginView;
});
