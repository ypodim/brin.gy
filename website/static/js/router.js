define([
    'jquery',
    'underscore',
    'backbone',

    'views/about',
    'views/desktopFrame',

    'views/mobileManager',
    'views/manager',
    'views/welcome',
], function($, _, Backbone, aboutView, DesktopAppView, mobileManagerView, ManagerView, WelcomeView){
  var AppRouter = Backbone.Router.extend({
    routes: {
        "about": "showAbout",
        "user/:user": "setUserContext",
        "context/:context": "setContext",
        "user/:user/context/:context": "setUserContext",
        "context/:context/user/:user": "setContextUser",
        
        "mobile": "doMobile",
        "tour": "takeTour",
        "tour/:page": "takeTour",
        "delete": "delUser",
        "*actions": "defaultRoute",
    },
    clientType: 'desktop',
    setClientType: function(t) {
        this.clientType = t;
        console.log('clientType', this.clientType);
        console.log('fragment', Backbone.history.fragment);
        
        console.log(DesktopAppView);
        console.log(ManagerView);
        console.log(aboutView);
        console.log('device', require.E.device);

        var frame_view = new DesktopAppView;
        frame_view.render();

        // if (t == 'mobile') {
        //     console.log('rendering mobile');
        //     contents_view = new mobileManagerView();
        // } else {
        //     console.log('rendering desktop');
        //     contents_view = new ManagerView();
        // }
        
        if (require.E.device == 'mobile') {
            contents_view = new mobileManagerView();
        } else {
            contents_view = new ManagerView();
        }

        
        contents_view.render();
    },

    doMobile: function() {
        this.setClientType('mobile');
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
        console.log( "default route CONTEXT:", cntx );
//         headerView.trigger_context_changed(cntx);
        this.setClientType('desktop');
    },
    delUser: function() {
        console.log("DELETE USER", E.agent.id);
        $("#delete-confirmation-modal").modal("show");
    },
    takeTour: function(page) {
        console.log("TOUR", page);
    },
  });


    // var initialize = function(){
    //     console.log('in router initialize')
    //     var app_router = new AppRouter;
    //     Backbone.history.start();
    // };
  return AppRouter;
});