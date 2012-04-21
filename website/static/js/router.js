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
], function(
    $, _, Backbone, common, 
    aboutView, loginView, mobileManagerView, sendMessageView, profileView, newAttrView, welcomeView, presentationView, accountView
    ){
  var AppRouter = Backbone.Router.extend({
    routes: {
        "about": "showAbout",

        'context': 'showContext',
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

        'account': 'account',

        "*actions": "defaultRoute",
    },

    uistate: {

    },
    setUIstate: function(options){
        var frag = Backbone.history.fragment;

        if (options==undefined) 
            options = {fullscreen:false, footer:true};
        if (options.fullscreen == undefined)
            options.fullscreen = false;
        if (options.footer == undefined)
            options.footer = true;
        if (options.title == undefined)
            options.title = frag;

        $('#footer').toggle(options.footer);
        this.state.doFullscreen({switch:options.fullscreen});

        $('#footer > a').removeClass('active');
        $('#footer > a[href="#/'+frag+'"]').addClass('active');

        if (frag in {all:1, me:1, filters:1}) {
            $('#footer > a[href="#/all"]').addClass('active');
            options.title = '';
            options.context = 'MIT Media Lab';
            this.state.attrCollection.trigger('value:change');
        } else {
            this.contents_view._isRendered = false;
            options.context = '';
        }
        
        this.controlsView.setTitle(options.title);
        this.controlsView.toggleContext(options.context);
        
        // this.state.hideSplash();
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
        this.setUIstate({fullscreen:true});
        sno = parseInt(sno);
        this.presView.slide = sno;
        this.presView.showSlide(sno);
        this.presView.show();
    },

    showUser: function(username) {
        this.setUIstate({footer:false, title:''});
        this.state.stats('user');
        var pview = new profileView({
            state: this.state,
            username:username,
        });
        pview.render();
        this.controlsView.doProfile(username);
    },
    showFilters: function(options){
        if (! this.contents_view._isRendered)
            return this.navigate('#/all', {trigger:true});
            
        this.setUIstate();
        this.state.stats('filters:filters');
        this.contents_view.render();
        this.contents_view.showFilters();
        this.controlsView.doFilters();
    },
    showAll: function( cntx ){
        this.setUIstate();
        this.state.stats('filters:all');
        this.contents_view.render();
        this.contents_view.showAll();
        this.controlsView.doAll();
    },
    showMe: function(){
        if (! this.contents_view._isRendered) 
            return this.navigate('#/all', {trigger:true});
            
        this.setUIstate();
        this.state.stats('filters:me');
        this.contents_view.render();
        this.contents_view.showMe();
        this.controlsView.doMe();
    },

    login: function() {
        this.setUIstate({footer:false});
        var lview = new loginView({
            state: this.state,
        });

        var actions = {signup:1, signin:1, reminder:1};
        if (Backbone.history.fragment in actions)
            lview.render({action:Backbone.history.fragment});

        this.controlsView.doLogin();
        this.state.stats('login');
    },

    newAttribute: function() {
        this.setUIstate({footer:false});
        var aview = new newAttrView({
            state: this.state,
        });
        aview.render();
        this.controlsView.doNewAttr();
    },
    sendmessage: function(){
        this.setUIstate({footer:false, title:'Chat'});
        this.state.stats('message');
        this.message = new sendMessageView({
            state: this.state,
        });
        this.message.render();
        this.controlsView.doMessage();
    },
    showAbout: function() {
        this.setUIstate({footer:false});

        aboutView.render();
    },

    showContext: function() {
        this.setUIstate();
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

        this.setUIstate();
        this.controlsView.doAccount();
        var account = new accountView({
            state: this.state,
        });
        account.render();
    },

    defaultRoute: function( cntx ){
        this.setUIstate({title:'Brin.gy'});
        
        this.state.stats('home');
        var wview = new welcomeView({
            state: this.state,
        });
        wview.render();
    },
  });

  return AppRouter;
});