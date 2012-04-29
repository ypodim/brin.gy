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
      this.state.stats('account:delete');
        this.state.router.contents_view._lastContext = '';
        this.state.deleteAccount();
    },
    signout: function(){
        this.state.stats('account:signout');
        common.cookies.del_cookie(this.state.user.name);
        this.state.user = {};
        this.state.router.contents_view._lastContext = '';
        this.state.router.navigate('#/', {trigger:true});
    },

    render: function(){
        var username = this.state.user.name;
        var email = this.state.user.email;
        var t = this.template( {username:username, email:email} );
        this.el.html(t);
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
