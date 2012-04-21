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
        console.log('delete')
        this.state.deleteAccount();
    },
    signout: function(){
        console.log('Logging out', this.state.user)
        common.cookies.del_cookie(this.state.user.name);
        this.state.user = {};
        this.state.router.navigate('#/', {trigger:true});
    },

    render: function(){
        var username = this.state.user.name;
        var email = this.state.user.email;
        var t = this.template( {username:username, email:email} );
        this.el.html(t);
        // this.state.doFullscreen({switch:false});
        return this;
    },

    initialize: function(options){
        _.bindAll(this, 'render', 'signout', 'delete');
        this.state = options.state;
        return this;
    },
  });
  return accountView;
});
