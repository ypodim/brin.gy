define([
  'jquery',
  'underscore', 
  'backbone',
  'common/ego_website',
  'text!templates/login.html',

  'views/nametag',
  ], function($, _, Backbone, common, loginViewTemplate, nametag){
  var loginView = Backbone.View.extend({
    el: $("#container"),
    events: {
        
    },
    initialize: function(options) {
        _.bindAll(this, 'loginBtn', 'render');
        this.state = options.state;
        this.$('form').bind('submit', this.loginBtn);
    },
    isValidEmail: function(username) {
        var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        return filter.test(username);
    },

    doLogin: function(username, password) {
        var that = this;
        var data = {user:username, secret:password};
        var url = this.state.agent.baseurl+'/authenticate_user';
        $.getJSON(url, data, function(json){
            if (json.result) {
                that.state.user.name = username;
                that.state.user.pwd = password;
                that.state.user.email = json.email;
                common.cookies.set_cookie(username, password, json.email);
                that.state.router.navigate('#/all', {trigger: true});
                that.state.stats('signin', username);
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

        var url = this.state.agent.baseurl;
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
                that.state.user.name = username;
                that.state.user.email = email;
                that.state.user.pwd = json.secret;
                common.cookies.set_cookie(username, json.secret, email);
                that.state.router.navigate('#/all', {trigger: true});
                that.state.stats('signup', username);
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
            that.state.router.navigate('#/all', {trigger: true});
        }, 3000);

        return false;
    },
    loginBtn: function(){
        // var deg = Math.floor(Math.random()*60) - 30;
        // console.log(deg);
        // this.$('#nametag').addClass('anime').css('-webkit-transform', 'rotate('+deg+'deg)');

        var username = this.$('div.'+Backbone.history.fragment+' input[type=text]').val();
        var password = this.$('div.'+Backbone.history.fragment+' input[type=password]').val();
        var email = this.$('div.'+Backbone.history.fragment+' input[type=email]').val();

        console.log('upe', username, password, email);

        if (username && password && username.length>0 && password.length>0)
            return this.doLogin(username, password);

        if (username && email && username.length>0 && email.length>0)
            return this.doCreate(username, email);

        if (email && email.length>0)
            return this.doReminder(email)

        return false;
    },
    
    render: function(options){
        // this.state.router.contents_view._lastContext = '';

        if (options==undefined)
            options = {action:'signup'};

        var compiled_template = _.template( loginViewTemplate );
        this.el.html( compiled_template() );

        this.$('div.nametag').hide();
        this.$('a').hide();
        var actions = {signup:1, signin:1, reminder:1};
        if (options.action in actions) {
            this.$('div.nametag.'+options.action).show();
            this.$('.'+options.action).show();
        }

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
        password.keypress(function(evt){
            if (evt.keyCode==13)
                that.$('form').submit();
        });
        email.keypress(function(evt){
            if (evt.keyCode==13)
                that.$('form').submit();
        });

        if (options.action=='reminder')
            email.focus();
    },
  });
  return loginView;
});
