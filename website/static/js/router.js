define([
    'jquery',
    'underscore',
    'backbone',

    'common/ego_website',

    'views/about',
    'views/login',
    'views/mobileManager',
    'views/sendMessage',
    'views/profile',
    'views/newAttribute',
], function(
    $, _, Backbone, common, 
    aboutView, loginView, mobileManagerView, sendMessageView, profileView, newAttrView
    ){
  var AppRouter = Backbone.Router.extend({
    routes: {
        "about": "showAbout",
        "context/:context": "setContext",
        "user/:user/context/:context": "setUserContext",
        "context/:context/user/:user": "setContextUser",

        "u/:user": "showUser",
        'login': 'login',
        // 'matches': 'matches',
        'sendmessage': 'sendmessage',

        'filters': 'showFilters',
        'me': 'showMe',
        'new': 'newAttribute',

        "tour": "takeTour",
        "tour/:page": "takeTour",
        "delete": "delUser",
        "*actions": "defaultRoute",
    },
    
    initialize: function(options){
        this.state = options.state;
        this.controlsView = options.controlsView;
        loginView.state = options.state;
        loginView.router = this;

        var pseudonyms = common.cookies.get_cookie().pseudonyms;
        for (username in pseudonyms) {
            this.state.user.name = username;
            this.state.user.pwd = pseudonyms[username];
        }

        this.contents_view = new mobileManagerView({
            state: this.state,
            controls: this.controlsView,
        });
        this.contents_view.resetCollections();

        this.controlsView.$('#loginBtn').click(loginView.loginBtn);
    },

    showUser: function(username) {
        var pview = new profileView({
            state: this.state,
            username:username,
        });
        pview.render();
        this.controlsView.doProfile(username);
        this.state.hideSplash();
    },
    showFilters: function(options){
        if (! this.contents_view._isRendered)
            this.navigate('#', {trigger:true});

        this.contents_view.render();
        this.contents_view.showFilters();
        this.controlsView.doFilters();
    },
    showMe: function(){
        if (! this.contents_view._isRendered)
            this.navigate('#', {trigger:true});

        this.contents_view.render();
        this.contents_view.showMe();
        this.controlsView.doMe();
    },

    login: function() {
        loginView.render();
        this.controlsView.doLogin();
        this.state.hideSplash();
    },

    newAttribute: function() {
        var aview = new newAttrView({
            state: this.state,
        });
        aview.render();
        this.controlsView.doNewAttr();
        this.state.hideSplash();
    },
    // matches: function(){
    //     this.matchesView = new matchesManagerView({
    //         state: this.state,
    //     });
    //     this.matchesView.render();

    //     this.state.hideSplash();
    // },
    sendmessage: function(){
        if (! this.contents_view._isRendered)
            this.navigate('#', {trigger:true});

        this.message = new sendMessageView({
            state: this.state,
        });
        this.message.render();
        this.controlsView.doMessage();
    },
    showAbout: function() {
        aboutView.render();
        this.state.hideSplash();
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
        this.contents_view.render();
        this.contents_view.showAll();
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