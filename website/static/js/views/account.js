define([
  'jquery',
  'underscore', 
  'backbone',
  'common/ego_website',
  'router',

  'text!templates/account.html',
  ], function($, _, Backbone, common, router, accountViewTemplate){
  var accountView = Backbone.View.extend({
    el: $("#container"),
    template: _.template(accountViewTemplate),
    events: {
        'click button#signout': 'signout',
        'click button#delete': 'delete',
    },

    delete: function(){
        // this.state.stats('account:delete');
        // this.state.router.contents_view._lastContext = '';
        // this.state.deleteAccount();
    },
    signout: function(){
        console.log('signout')
        // this.state.stats('account:signout');
        common.cookies.del_cookie(this.state.user.name);
        // this.state.user = {};
        // this.state.router.contents_view._lastContext = '';
        // this.state.router.navigate('#/', {trigger:true});
    },

    render: function(){
        var username = this.state.user.name;
        var email = this.state.user.email;
        var t = this.template( {username:username, email:email} );
        this.el.html(t);

        window.fbAsyncInit = this.fbAsyncInit;
        var js, id = 'facebook-jssdk'; 
        if (document.getElementById(id)) {return;}
        js = document.createElement('script'); 
        js.id = id; js.async = true;
        js.src = "//connect.facebook.net/en_US/all.js";
        document.getElementsByTagName('head')[0].appendChild(js);

        return this;
    },

    
    success: function(response) {
        console.log(response);
    },

    fbAsyncInit: function() {
        FB.init({
            appId: '175782962471804',
            status: true, 
            cookie: true,
            xfbml: true,
            oauth: true,
            // scope: "email, user_about_me",
        });

        FB.getLoginStatus(function(response) {
            
            if (response.status === 'connected') {
                var uid = response.authResponse.userID;
                var accessToken = response.authResponse.accessToken;
                console.log('accessToken', accessToken);

                // var url = 'https://graph.facebook.com/me';
                FB.api('/me', function(res){ 
                    console.log(res)
                })

                FB.api('/me/friends', function(res){ 
                    console.log(res)
                })

                FB.api('/me/picture', function(res){ 
                    console.log(res)
                })

                FB.api('/me/statuses', function(res){ 
                    console.log(res)
                })

            } else if (response.status === 'not_authorized') {
                console.log("the user has not authenticated your app");
            } else {
                console.log("the user isn't logged in to Facebook.");
            }
            });
    },

    initialize: function(options){
        _.bindAll(this, 'render', 'signout', 'delete');
        this.state = options.state;
        return this;
    },
  });
  return accountView;
});
