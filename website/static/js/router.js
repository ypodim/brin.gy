define([
    'jquery',
    'underscore',
    'backbone',

    'common/ego_website',

    'views/about',
    'views/login',
    'views/mobileManager',
], function(
    $, _, Backbone, common, aboutView, loginView, mobileManagerView
    ){
  var AppRouter = Backbone.Router.extend({
    routes: {
        "about": "showAbout",
        "user/:user": "setUserContext",
        "context/:context": "setContext",
        "user/:user/context/:context": "setUserContext",
        "context/:context/user/:user": "setContextUser",
        'login': 'login',
        'matches': 'matches',

        "tour": "takeTour",
        "tour/:page": "takeTour",
        "delete": "delUser",
        "*actions": "defaultRoute",
    },
    
    initialize: function(options){
        this.state = options.state;
        this.controlsView = options.controlsView;
        this.attrCollection = options.attrCollection;
        loginView.state = options.state;
        loginView.router = this;

        this.contents_view = new mobileManagerView({
            state: this.state,
            attrCollection: this.attrCollection,
        });

        this.controlsView.$('#loginBtn').click(loginView.loginBtn);
    },
    login: function() {
        loginView.render();
        this.controlsView.doLogin();
    },
    matches: function(){
        console.log(this.state.personCollection.length);
    },
    showAbout: function() {
        aboutView.render();
    },
    setUserContext: function( user, context ) {
        console.log( "**** Set user:", user, "context:", context  );   
    },
    setContextUser: function( context, user ) {
        this.setUserContext(user, context);
    },
    setContext: function( context ) {
        this.setUserContext(undefined, context);
    },
    
    defaultRoute: function( cntx ){
        var pseudonyms = common.cookies.get_cookie().pseudonyms;
        for (username in pseudonyms) {
            this.state.user.name = username;
            this.state.user.pwd = pseudonyms[username];
        }

        this.contents_view.render();
        this.controlsView.doDefault();
    },
    delUser: function() {
        console.log("DELETE USER", E.agent.id);
        $("#delete-confirmation-modal").modal("show");
    },
    takeTour: function(page) {
        console.log("TOUR", page);
    },
  });

  return AppRouter;
});