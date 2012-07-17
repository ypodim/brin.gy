define([
  'jquery',
  'underscore', 
  'backbone',
  'tooltip',
  'common/ego_website',
  'text!templates/signin.html',
  'text!templates/signup.html',
  ], function($, _, Backbone, tooltip, common, signinTemplate, signupTemplate){
  var loginView = Backbone.View.extend({
    el: $('#login'),
    events: {
        'click *': 'defaultClick',
        'click button': 'okBtn',
        'submit form': 'submit',
    },

    submit: function(e){
        if (this.options.action == 'signin') {
            username = this.$('input#username').val();
            password = this.$('input#password').val();
            this.doLogin(username, password);
            this.el.hide();
        }
        if (this.options.action == 'signup') {
            username = this.$('input#username').val();
            email = this.$('input#email').val();
            console.log(this.$('img.loader'))
            console.log(this.$('img'))

            this.$('img.loader').show();
            this.doCreate(username, email);
        }
        return false;
    },
    okBtn: function(e) {
        console.log('okbtn')
        this.$('form').submit();
    },
    defaultClick: function(e){
        e.stopPropagation();
    },
    
    isValidEmail: function(username) {
        var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        return filter.test(username);
    },

    doLogin: function(username, password) {
        var that = this;
        var data = {user:username, secret:password};
        var url = APP.agent.baseurl+'/authenticate_user';
        $.getJSON(url, data, function(json){
            if (json.result) {
                APP.usernames[username] = {
                    name: username,
                    pwd: password,
                    email: json.email,
                };
                APP.user = username;
                common.cookies.set_cookie(username, password, json.email);
                // APP.stats('signin', username);
                that.trigger('login');
            } else {
                $('div.alert')
                    .removeClass('alert-success')
                    .addClass('alert-error')
                    .html('Wrong username/email or password.')
                    .slideDown();
                setTimeout(function(){
                    $('div.alert').fadeOut();
                }, 3000);
            }
        });
        return false;
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

        var url = APP.agent.baseurl;
        $.post(url, {username:username, email:email}, function(json){
            if (json.error.length>0) {
                that.$('div.alert')
                    .html('User '+username+' already exists.')
                    .slideDown();
                setTimeout(function(){
                    that.$('div.alert').fadeOut();
                }, 3000);
                return false;
            } else {
                APP.user = username;
                APP.usernames[username] = {
                    name: username,
                    pwd: json.secret,
                    email: email,
                };
                common.cookies.set_cookie(username, json.secret, email);
                // that.state.stats('signup', username);
                that.el.hide();
                that.trigger('signedup');
            }
        }, 'json');
        
        return false;
    },
    doReminder: function(email) {
        console.log('doReminder');
        var that = this;
        var data = {email:email};
        var url = this.state.agent.baseurl+'/email_reminder';
        $.post(url, data, function(json){
            console.log(json);
            if (json.error) {
                $('div.alert')
                    .removeClass('alert-success')
                    .addClass('alert-error')
                    .html('Email address not found.')
                    .slideDown();
                setTimeout(function(){
                    $('div.alert').fadeOut();
                }, 3000);
            } else {
                that.state.stats('reminder', email);
            }
        }, 'json');
        
        $('div.alert')
            .addClass('alert-success')
            .removeClass('alert-error')
            .html('Email reminder sent successfully.')
            .slideDown();
        setTimeout(function(){
            $('div.alert').fadeOut();
            that.state.router.navigate('#/attributes', {trigger: true});
        }, 3000);

        return false;
    },
    
    render: function(options){
        // this.state.router.contents_view._lastContext = '';
        var compiled_template;
        this.options = options;
        if (options==undefined)
            options = {action:'signup'};

        if (options.action == 'signup') {
            compiled_template = _.template( signupTemplate );
            this.el.html( compiled_template() ).css({right:'50px'}).show();
            // this.$('input:first-child').tooltip('show');
            // this.$('button').tooltip('show');
        }
        if (options.action == 'signin') {
            compiled_template = _.template( signinTemplate );
            this.el.html( compiled_template() ).css({right:'185px'}).show();
        }
        if (options.action=='reminder') {
            // this.el.html( compiled_template() ).show();
        }
        
        return;

        var that = this;

        var email = this.$('div.'+options.action+' input[type=email]');
        var password = this.$('div.'+options.action+' input[type=password]');
        
        this.$('input[type=text]').focus().keypress(function(evt){
            if (evt.keyCode==13) {
                if (options.action=='signin')
                    password.focus();
                if (options.action=='signup')
                    email.focus();
            }
        });
        // password.keypress(function(evt){
        //     if (evt.keyCode==13)
        //         that.$('form').submit();
        // });
        // email.keypress(function(evt){
        //     if (evt.keyCode==13)
        //         that.$('form').submit();
        // });

        
    },

    initialize: function(options) {
        _.bindAll(this, 'render', 'doLogin', 'doCreate', 'submit');
    },
  });
  return loginView;
});
