define([
    'jquery',
    'underscore',
    'backbone',
    'app',

    'views/login',
    
    'views/sendMessage',
    'views/account',
    'views/world',
], function(
    $, _, Backbone, appConfig, loginView, sendMessageView, accountView, worldView
    ){
  var AppRouter = Backbone.Router.extend({
    app: appConfig.getState(),
    routes: {
        "about": "showAbout",

        "c/:context": "setContext",

        'presentation/:sno': 'presentation',
        'signin': 'login',
        'signup': 'login',
        'reminder': 'login',
        
        'sendmessage': 'sendmessage',

        'attributes': 'attributes',
        'account': 'account',
        'stats': 'stats',

        'apps': 'apps',
        'explore': 'explore',

        "*actions": "defaultRoute",
    },
    
    initialize: function(options){
        _.bindAll(this, 'login');
        this.worldView = options.worldView;        
    },

    apps: function(){
        this.worldView.showAllContexts();
    },

    explore: function(){
        this.worldView.showExplorer();
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

    startNewAttribute: function(state){
        if (! state.isLoggedin()) return false;
        state.stats('newattr:btnTop');
        state.router.navigate('#/new/'+state.context.title, {trigger:true});
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
            leftClb: function(){that.navigate('#/attributes');},
        });
    },

    newAttribute: function(context, key, val) {
        if (!context) {
            // context = this.state.context.title;
            // this.navigate('#/new/'+context, {trigger:true});
            this.navigate('#/attributes', {trigger:true});
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
        // this.controlsView.setUIstate({
            // footer:false,
        // });
        this.app.modal.render({title: 'about'});
    },

    setContext: function( cid ) {
        var that = this;
        var url = this.app.satellite.url+'/contexts';
        $.getJSON(url, function(json){
            for (var i in json.contexts) {
                var cntx = json.contexts[i];
                if (cntx.id == cid) {
                    that.app.setContext(cntx);
                    that.app.cookies.set_context_in_cookie(cntx);
                    that.worldView.render();
                    that.app.navbarView.render();
                    return;
                }
            }
        })
    },
    
    attributes: function() {
        this.navigate('#/c/'+this.state.context.title, {trigger:true});
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
        console.log('default route')
        // this.app.navbarView.contextMenu();
    },
  });

  return AppRouter;
});