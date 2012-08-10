define([
  'jquery',
  'underscore', 
  'backbone',
  'app',

  'text!templates/account.html',
  ], function($, _, Backbone, appConfig, accountViewTemplate){
  var accountView = Backbone.View.extend({
    // el: $("#container"),
    template: _.template(accountViewTemplate),
    events: {
        'click button#signout': 'signout',
        'click button#delete': 'delete',
        'change input[type=checkbox]': 'alertOption',
    },
    app: appConfig.getState(),

    alertOption: function(e){
        var input = $(e.target);
        var option = input.attr('name');
        var checked = (input.attr('checked') == 'checked');
        var options = {option: option, value: checked};
        this.app.saveOption(options);
    },

    delete: function(){
        if (confirm('All data associated with '+this.app.agent.id()+'\nwill be lost. Delete?')) {
            this.trigger('delete');
            this.app.trigger('delete');
        }
    },

    signout: function(){
        this.app.trigger('signout');
        this.trigger('signout');
    },

    render: function(){
        var that = this;
        this.app.agent.loadUserOptions(function(options){
            var onvalueadded = options['alert:onvalueadded'];
            var onvaluecreated = options['alert:onvaluecreated'];
            var onattribute = options['alert:onattribute'];
            var onapplication = options['alert:onapplication'];

            var username = that.app.agent.fullInfo().name;
            var email = that.app.agent.fullInfo().email;
            var t = that.template({
                username: username, 
                email: email,
                onvalueadded: (onvalueadded) ? 'checked' : '',
                onvaluecreated: (onvaluecreated) ? 'checked' : '',
                onattribute: (onattribute) ? 'checked' : '',
                onapplication: (onapplication) ? 'checked' : '',
            });
            that.$el.html(t);
        });
        

        // window.fbAsyncInit = this.fbAsyncInit;
        // var js, id = 'facebook-jssdk'; 
        // if (document.getElementById(id)) {return;}
        // js = document.createElement('script'); 
        // js.id = id; js.async = true;
        // js.src = "//connect.facebook.net/en_US/all.js";
        // document.getElementsByTagName('head')[0].appendChild(js);

        return this;
    },

    
    // success: function(response) {
    //     console.log(response);
    // },

    // fbAsyncInit: function() {
    //     FB.init({
    //         appId: '175782962471804',
    //         status: true, 
    //         cookie: true,
    //         xfbml: true,
    //         oauth: true,
    //         // scope: "email, user_about_me",
    //     });

    //     FB.getLoginStatus(function(response) {
            
    //         if (response.status === 'connected') {
    //             var uid = response.authResponse.userID;
    //             var accessToken = response.authResponse.accessToken;
    //             console.log('accessToken', accessToken);

    //             // var url = 'https://graph.facebook.com/me';
    //             FB.api('/me', function(res){ 
    //                 console.log(res)
    //             })

    //             FB.api('/me/friends', function(res){ 
    //                 console.log(res)
    //             })

    //             FB.api('/me/picture', function(res){ 
    //                 console.log(res)
    //             })

    //             FB.api('/me/statuses', function(res){ 
    //                 console.log(res)
    //             })

    //         } else if (response.status === 'not_authorized') {
    //             console.log("the user has not authenticated your app");
    //         } else {
    //             console.log("the user isn't logged in to Facebook.");
    //         }
    //         });
    // },

    initialize: function(options){
        _.bindAll(this, 'render');
        return this;
    },
  });
  return accountView;
});
