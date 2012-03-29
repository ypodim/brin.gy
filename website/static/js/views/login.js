define([
  'jquery',
  'underscore', 
  'backbone',
  'common/ego_website',
  'text!templates/login.html'
  ], function($, _, Backbone, common, loginViewTemplate){
  var loginView = Backbone.View.extend({
    el: $("#container"),
    events: {
        
    },
    initialize: function(options) {
        _.bindAll(this, 'loginBtn', 'render');
        // this.state = options.state;
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
                common.cookies.set_cookie(username, password);
                that.router.navigate('#', {trigger: true});
            } else {
                that.$('div.alert')
                    .html('Wrong username/email or password.')
                    .slideDown();
                setTimeout(function(){
                    that.$('div.alert').fadeOut();
                }, 3000);
            }
        });
        return false;
    },
    doCreate: function(username, email) {
        var that = this;
        if (! this.isValidEmail(email)) {
            this.$('div.alert')
                .html('Invalid email address.')
                .slideDown();
            setTimeout(function(){
                that.$('div.alert').fadeOut();
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
                common.cookies.set_cookie(username, json.secret);
                that.router.navigate('#', {trigger: true});
            }
        }, 'json');
        
        return false;
    },
    loginBtn: function(){
        var username = this.$('input#useremail').val();
        var password = this.$('input#password').val();
        var newusername = this.$('input#newusername').val();
        var newemail = this.$('input#newemail').val();

        if (username.length>0 && password.length>0)
            return this.doLogin(username, password);

        if (newusername.length>0 && newemail.length>0)
            return this.doCreate(newusername, newemail);
    },
    render: function(){
        var compiled_template = _.template( loginViewTemplate );
        this.el.html( compiled_template() );

        var that = this;
        this.$('input#useremail').focus().keypress(function(evt){
            if (evt.keyCode==13)
                that.$('input#password').focus();
        })
        this.$('input#password').keypress(function(evt){
            if (evt.keyCode==13)
                that.loginBtn();
        })

        this.$('input#newusername').keypress(function(evt){
            if (evt.keyCode==13)
                that.$('input#newemail').focus();
        })
        this.$('input#newemail').keypress(function(evt){
            if (evt.keyCode==13)
                that.loginBtn();
        })

        this.$('form').one('submit', this.loginBtn);
    },
  });
  return new loginView;
});
