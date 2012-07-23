define([
  'jquery',
  'underscore', 
  'backbone',
  'app',
  'tooltip',
  
  'text!templates/signin.html',
  'text!templates/signup.html',
  ], function($, _, Backbone, appConfig, tooltip, signinTemplate, signupTemplate){
  var loginView = Backbone.View.extend({
    el: $('#login'),
    events: {
        'click *': 'defaultClick',
        'click button': 'okBtn',
        'submit form': 'submit',
        'click a.reminder': 'reminder',
    },
    app: appConfig.getState(),

    close: function(){
        this.$el.hide();
    },

    submit: function(e){
        if (this.options.action == 'signin') {
            username = this.$('input#username').val();
            password = this.$('input#password').val();
            this.app.doLogin(username, password);
            this.$el.hide();
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
            compiled_template = _.template( signupTemplate );
            this.$el.html( compiled_template() ).css({right:'50px'}).show();
        }
        if (options.action == 'signin') {
            compiled_template = _.template( signinTemplate );
            this.$el.html( compiled_template() ).css({right:'185px'}).show();
        }
        if (options.action=='reminder') {
            // this.el.html( compiled_template() ).show();
        }
    },

    initialize: function(options) {
        _.bindAll(this, 'render', 'doCreate', 'submit', 'reminder');
    },
  });
  return loginView;
});
