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
    'views/welcome',
    'views/presentation',
    'views/account',
    'views/contexts',
    'views/newContext',
], function(
    $, _, Backbone, common, 
    aboutView, loginView, mobileManagerView, sendMessageView, profileView, newAttrView, welcomeView, presentationView, accountView, contextsView, newContextView
    ){
  var AppRouter = Backbone.Router.extend({
    routes: {
        "about": "showAbout",

        'context': 'showContext',
        'newcontext': 'newContext',
        "context/:context": "setContext",
        "user/:user/context/:context": "setUserContext",
        "context/:context/user/:user": "setContextUser",

        'presentation/:sno': 'presentation',
        "u/:user": "showUser",
        'signin': 'login',
        'signup': 'login',
        'reminder': 'login',
        
        'sendmessage': 'sendmessage',

        'filters': 'showFilters',
        'all': 'showAll',
        'me': 'showMe',
        'new': 'newAttribute',
        'new/incontext/:context': 'newAttribute',

        'account': 'account',

        "*actions": "defaultRoute",
    },
    
    initialize: function(options){
        _.bindAll(this, 'login');
        this.state = options.state;
        this.controlsView = options.controlsView;

        var pseudonyms = common.cookies.get_cookie().pseudonyms;
        for (username in pseudonyms) {
            this.state.user.name = username;
            this.state.user.pwd = pseudonyms[username].secret;
            this.state.user.email = pseudonyms[username].email;
        }

        this.contents_view = new mobileManagerView({
            state: this.state,
            controls: this.controlsView,
        });
        this.contents_view.resetCollections();

        this.presView = new presentationView({
            router:this,
        });
    },

    presentation: function(sno){
        this.controlsView.setUIstate({
            fullscreen:true,
        });
        sno = parseInt(sno);
        this.presView.slide = sno;
        this.presView.showSlide(sno);
        this.presView.show();
    },

    showUser: function(username) {
        this.state.stats('user');
        var pview = new profileView({
            state: this.state,
            username:username,
        });
        pview.render();

        this.controlsView.setUIstate({
            footer:false, 
            title:'',
            profile: username,
        });
    },
    showFilters: function(options){
        if (! this.contents_view._isRendered)
            return this.navigate('#/all', {trigger:true});
        
        this.state.stats('filters:filters');
        this.contents_view.render();
        this.contents_view.showFilters();

        var that = this;
        this.controlsView.setUIstate({
            rightTitle: 'Send Message',
            rightClb: function() {
                if (that.state.personCollection.included().length > 5)
                    that.state.showMessage('You can only contact up to 5 people at a time. Please choose 5 among your matches, or add more filters.');
                else
                    that.state.router.navigate('sendmessage', {trigger:true});
            },
        });
    },
    startNewAttribute: function(state){
        if (! state.isLoggedin()) return false;
        state.stats('newattr:btnTop');
        state.router.navigate('#/new', {trigger:true});
    },
    showAll: function( cntx ){
        this.state.stats('filters:all');
        this.contents_view.render();
        this.contents_view.showAll();

        var that = this;
        this.controlsView.setUIstate({
            rightTitle: 'Start New Attribute',
            rightClb: function(){that.startNewAttribute(that.state)},
        });
    },
    showMe: function(){
        if (! this.contents_view._isRendered) 
            return this.navigate('#/all', {trigger:true});
            
        this.state.stats('filters:me');
        this.contents_view.render();
        this.contents_view.showMe();
        
        var that = this;
        this.controlsView.setUIstate({
            rightTitle: 'Start New Attribute',
            rightClb: function(){that.startNewAttribute(that.state)},
        });
    },

    login: function() {
        var lview = new loginView({
            state: this.state,
        });

        var actions = {signup:1, signin:1, reminder:1};
        if (Backbone.history.fragment in actions)
            lview.render({action:Backbone.history.fragment});

        this.state.stats('login');

        var that = this;
        this.controlsView.setUIstate({
            footer:false,
            rightClb: lview.loginBtn,
            leftClb: function(){that.navigate('#/all');},
        });
    },

    newAttribute: function(context) {
        var aview = new newAttrView({
            state: this.state,
            context: context,
        });
        aview.render();
        
        this.controlsView.setUIstate({
            footer:false, 
            title:'New attribute',
            rightClb: aview.save,
            rightTitle: 'Save',
        });
    },
    sendmessage: function(){
        this.state.stats('message');
        this.message = new sendMessageView({
            state: this.state,
        });
        this.message.render();

        this.controlsView.setUIstate({
            footer:false, 
            title:'Chat',
            rightTitle: 'Send',
            rightClb: this.message.send,
        });
    },
    showAbout: function() {
        this.controlsView.setUIstate({
            footer:false,
        });

        aboutView.render();
    },

    newContext: function() {
        ncview = new newContextView({
            state: this.state,
        });
        ncview.render();

        this.controlsView.setUIstate({
            footer:false, 
            title:'New context',
            rightClb: function(){ncview.getLocation()},
            rightTitle: 'Next',
        });
    },
    showContext: function(){
        cview = new contextsView({
            state: this.state,
        });
        cview.render();
        var that = this;
        this.controlsView.setUIstate({
            rightClb: function(){that.navigate('#/newcontext', {trigger:true});},
            rightTitle: 'New Context',
            title: 'Contexts',
        });
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
    
    account: function(){
        if (! this.state.isLoggedin())
            return false;

        this.controlsView.setUIstate();
        var account = new accountView({
            state: this.state,
        });
        account.render();
    },

    defaultRoute: function( cntx ){
        this.controlsView.setUIstate({title:'Brin.gy'});
        
        this.state.stats('home');
        var wview = new welcomeView({
            state: this.state,
        });
        wview.render();
    },
  });

  return AppRouter;
});