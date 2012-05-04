define([
    'jquery',
    'underscore',
    'backbone',

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
    'views/stats',
], function(
    $, _, Backbone, 
    aboutView, loginView, mobileManagerView, sendMessageView, profileView, newAttrView, welcomeView, presentationView, accountView, contextsView, newContextView, statsView
    ){
  var AppRouter = Backbone.Router.extend({
    routes: {
        "about": "showAbout",

        'context': 'showContext',
        'newcontext': 'newContext',
        'newcontext/:context': 'newContext',
        "context/:context": "setContext",
        "c/:context": "setContext",

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
        'new/:context': 'newAttribute',
        'new/:context/:key': 'newAttribute',
        'new/:context/:key/:val': 'newAttribute',

        'account': 'account',
        'stats': 'stats',

        "*actions": "defaultRoute",
    },
    
    initialize: function(options){
        _.bindAll(this, 'login');
        this.state = options.state;
        this.controlsView = options.controlsView;

        this.contents_view = new mobileManagerView({
            state: this.state,
            controls: this.controlsView,
        });
        // this.contents_view.resetCollections();

        this.presView = new presentationView({
            router:this,
        });

        this.wview = new welcomeView({
            state: this.state,
        });
    },

    stats: function(){
        var sview = new statsView({
            state: this.state,
        });
        sview.render();

        this.controlsView.setUIstate({
            title: 'stats',
            footer:false,
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
        state.router.navigate('#/new/'+state.context.name, {trigger:true});
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

        var frag = Backbone.history.fragment;
        var actions = {signup:1, signin:1, reminder:1};
        if (frag in actions)
            lview.render({action:frag});

        this.state.stats('login');
        var title = frag;
        if (frag == 'signup')
            title = 'Sign Up';
        if (frag == 'signin')
            title = 'Sign In';

        var that = this;
        this.controlsView.setUIstate({
            title: title,
            footer:false,
            rightClb: lview.loginBtn,
            leftClb: function(){that.navigate('#/all');},
        });
    },

    newAttribute: function(context, key, val) {
        if (!context) {
            // context = this.state.context.name;
            // this.navigate('#/new/'+context, {trigger:true});
            this.navigate('#/all', {trigger:true});
            return;
        }
        var aview = new newAttrView({
            state: this.state,
            context: context,
            key: key,
            val: val,
        });
        aview.render();
        
        
        btnTitle = 'Next';
        title = 'New attribute';
        if (key) {
            btnTitle = 'Save';
            title = 'New value';
        }

        this.controlsView.setUIstate({
            footer: false, 
            title: title,
            rightClb: function(){aview.next()},
            rightTitle: btnTitle,
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

    newContext: function(contextName) {
        ncview = new newContextView({
            state: this.state,
            context: contextName,
        });
        ncview.render(contextName);

        this.controlsView.setUIstate({
            footer:false, 
            title:'New context',
            leftClb: function(){ncview.previous()},
            rightClb: function(){ncview.next()},
            rightTitle: 'Next',
        });
    },
    showContext: function(){
        var cview = new contextsView({
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
    setContext: function( context ) {
        var that = this;
        var url = this.state.satellite.url+'/contexts';
        $.getJSON(url, function(json){
            for (var i in json.contexts) {
                var cntx = json.contexts[i];
                if (cntx.name == context) {
                    that.state.setContext({name:context});
                    that.navigate('#/all', {trigger:true});
                    return;
                }
            }
            that.newContext(context);
        })
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
        this.controlsView.setUIstate({
            title: 'Brin.gy',
            fullscreen: true,
            footer: false,
        });
        
        this.state.stats('home');
        this.wview.render();
    },
  });

  return AppRouter;
});