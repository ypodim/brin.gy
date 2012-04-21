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

    delete: function(){},
    signout: function(){
        console.log('Logging out', this.state.user)
        common.cookies.del_cookie(this.state.user.name);
        this.state.user = {};
        this.state.router.navigate('#/', {trigger:true});
    },

    render: function(){
        var username = this.state.user.name;
        var t = this.template( {username:username, email:'ypodim'} );
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
