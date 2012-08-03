// Author: Thomas Davis <thomasalwyndavis@gmail.com>
// Filename: main.js

// Require.js allows us to configure shortcut alias
require.config({
  paths: {
    jquery: 'libs/jquery/jquery-min',
    cookie: 'libs/jquery/jquery.cookie',

    backbone: 'libs/backbone/backbone-min',
    underscore: 'libs/underscore/underscore-min',
    text: 'libs/require/text',
    order: 'libs/require/order',

    scroll: 'libs/scroller/jquery.scrollIntoView',

    bootstrap: 'libs/bootstrap/bootstrap',
    alerts: 'libs/bootstrap/bootstrap-alerts',
    modal: 'libs/bootstrap/bootstrap-modal',
    tooltip: 'libs/bootstrap/bootstrap-tooltip',
    // popover: 'libs/bootstrap/bootstrap-popover',
    button: 'libs/bootstrap/bootstrap-button',

    maps: 'libs/gmaps/gmaps',
  },
  urlArgs: "bust=" +  (new Date()).getTime(),
});

require([
    'jquery',
    'bootstrap',
    'underscore',
    'app',

    'router',
    'backbone',

    'views/world',
    'views/navbar',
    'views/login',
    'views/modal'
], function($, bootstrap, _, app, Router, Backbone,
    worldView, navbarView, loginView, modalView
    ){

    var appp = app.getState();

    $.getJSON('/config', function(config){
        appp.setConfig(config);
        appp.initConfig();

        console.log('1', appp, appp.context, appp.config)

        // worldView
        var wldView = new worldView();
        wldView.render();

        console.log('2', appp, appp['context'])

        
        
        // navbar
        appp.navbarView = new navbarView({});
        appp.navbarView.render();
   
        // modal     
        appp.modal = new modalView();
        appp.modal.bind('logout', function(){
            var username = appp.agent.id();
            // that.app.agent.removeUserInfo(username);
            appp.cookies.del_cookie(username);
            appp.agent.unsetAgentId();
            appp.navbarView.render();
            wldView.render();
        });

        appp.modal.bind('reminder', function(){
            var email = appp.modal.$('input#email').val();
            console.log('reminder works', email);
            return;
            
            appp.doReminder(email);
            appp.modal.close();
        });

        appp.modal.bind('delete', function(){
            appp.doDelete();
        });

        appp.modal.bind('newkey', function(m){
            m.prepend = 1;
            m.score = 1;
            console.log('app', m)
            wldView.appendKey(m);
        });
        

        appp.navbarView.bind('signin', wldView.showLoginBox);
        appp.navbarView.bind('signup', wldView.showLoginBox);
        appp.navbarView.bind('contexts', wldView.showAllContexts);
        appp.navbarView.bind('account', wldView.showAccount);
        appp.navbarView.bind('about', function(){
            appp.modal.render({title: 'about'});
        });
        
        appp.loginView = new loginView();
        appp.loginView.bind('reminder', wldView.showReminder);

        
        appp.bind('loggedin', wldView.render);
        appp.bind('loggedin', appp.navbarView.render);
        appp.bind('signedup', appp.navbarView.render);
        appp.bind('deleted', appp.navbarView.render);
        appp.bind('addattr', wldView.addAttr);
        appp.bind('remattr', wldView.remAttr);

        // appp.loginView.bind('context:new', appp.navbarView.render);
        // appp.loginView.bind('context:new', appp.navbarView.render);

        appp.loginView.bind('context:all', appp.navbarView.render);
        appp.loginView.bind('context:all', wldView.showAllContexts);

        var app_router = new Router({
            worldView: wldView,
        });
        Backbone.history.start();
    });
});
