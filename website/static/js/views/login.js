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

    loginBtn: function(){
        username = this.$('input[type=text]').val();
        password = this.$('input[type=password]').val();

        // if (this.isValidEmail(username))
            // username, password,

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
                that.$('div.alert').show();
                setTimeout(function(){
                    that.$('div.alert').fadeOut();
                }, 3000);
            }
        });
        return false;
    },
    render: function(){
        var compiled_template = _.template( loginViewTemplate );
        this.el.html( compiled_template() );

        var that = this;
        this.$('input[type=text]').focus().keypress(function(evt){
            if (evt.keyCode==13)
                that.$('input[type=password]').focus();
        });
        this.$('input[type=password]').keypress(function(evt){
            if (evt.keyCode==13)
                that.$('form').submit();
        });
        this.$('form').submit(this.loginBtn);
    },
  });
  return new loginView;
});
