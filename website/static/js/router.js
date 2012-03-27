define([
    'jquery',
    'underscore',
    'backbone',

    'views/about',
], function(
    $, _, Backbone, aboutView
    ){
  var AppRouter = Backbone.Router.extend({
    routes: {
        "about": "showAbout",
        "user/:user": "setUserContext",
        "context/:context": "setContext",
        "user/:user/context/:context": "setUserContext",
        "context/:context/user/:user": "setContextUser",
        
        "tour": "takeTour",
        "tour/:page": "takeTour",
        "delete": "delUser",
        "*actions": "defaultRoute",
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
        // console.log( "default route CONTEXT:", cntx );
//         headerView.trigger_context_changed(cntx);
    },
    delUser: function() {
        console.log("DELETE USER", E.agent.id);
        $("#delete-confirmation-modal").modal("show");
    },
    takeTour: function(page) {
        console.log("TOUR", page);
    },
  });


    var initialize = function(){
        console.log('in router initialize')
    };
  return AppRouter;
});