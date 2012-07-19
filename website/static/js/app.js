define(['jquery','backbone','underscore','cookie'], function ($, Backbone, _, ck) {
var state = {
    agent: {
        _baseurl: '',
        _agentid: '',
        _usernames: {},
        url: function(){
            return this._baseurl+"/"+this._agentid;
        },
        baseUrl: function(){
            return this._baseurl;
        },
        setBaseUrl: function(url){ this._baseurl = url; },
        setAgentId: function(aid){ this._agentid = aid; },
        unsetAgentId: function(aid){ this._agentid = ''; },
        loggedIn: function() { return (this._agentid != '')},
        id: function() { return this._agentid; },


        addUserInfo: function(info){
            this._usernames[info.name] = info;
        },
        removeUserInfo: function(username){
            delete this._usernames[username];
        },
        fullInfo: function() {  
            if (!this.loggedIn()) {
                console.log('Error: fullInfo: not logged in.');
                return {};
            }
            return this._usernames[this.id()];
        }
    },

    setConfig: function(config) {
        console.log('config:', config)
        this.config = config;
        this.satellite = {};
        this.satellite.url = config.discov_url;
        
        this.agent.setBaseUrl( config.ego_url_prefix );
        this.agent.setAgentId( config.agentid );

        this.website_url = config.website_url_prefix;
        this.device = config.device;
    },

    initConfig: function() {
        var cookie = this.cookies.get_cookie();
        var pseudonyms = cookie.pseudonyms;
        for (username in pseudonyms) {
            var pwd = pseudonyms[username].secret;
            var email = pseudonyms[username].email;
            var info = {pwd:pwd, email:email, name:username};
            this.agent.addUserInfo(info);
            this.agent.setAgentId( username );
        }

        console.log('context in cookie', cookie.last_context);
        if (!cookie.last_context) {
            cookie.last_context = 'all';
            this.cookies.set_context_in_cookie(cookie.last_context);
        }
        this.context = {name:cookie.last_context};
        console.log('now context in cookie', this.cookies.get_cookie().last_context);
    },



    cookies: {
        get_cookie: function()
        {
            cookie = {pseudonyms:{}};
            cookie_str = $.cookie('bringy', {path:"/"});
            if (typeof(cookie_str) == "string"){
                cookie = JSON.parse(cookie_str);
        //         console.log("get_cookie:",cookie_str);
            }
            return cookie;
        },

        set_context_in_cookie: function(context)
        {
            cookie_str = $.cookie('bringy', {path:"/"});
            if (typeof(cookie_str) != "string") 
                cookie_str = "{}";
            
            cookie = JSON.parse(cookie_str);
            cookie.last_context = context;
            cookie_str = JSON.stringify(cookie);
            $.cookie('bringy', cookie_str, {expires:7, path:"/"});
        },

        set_cookie: function(name, secret, email)
        {
            if (secret == undefined)
                secret = 0
            cookie_str = $.cookie('bringy', {path:"/"});
        //     console.log("set_cookie other_names1", cookie_str, name);
            if (typeof(cookie_str) != "string") 
                cookie_str = "{}";
            
            cookie = JSON.parse(cookie_str);
            if (cookie.pseudonyms == undefined)
                cookie.pseudonyms = {};
            cookie.pseudonyms[name] = {secret:secret, email:email};    
            cookie_str = JSON.stringify(cookie);
        //     console.log("set_cookie other_names2", cookie_str, secret);
            $.cookie('bringy', cookie_str, {expires:7, path:"/"});
        },

        del_cookie: function(name)
        {
            cookie = {};
            cookie_str = $.cookie('bringy', {path:"/"});
        //     console.log("delete: cookie_str is:", cookie_str);
            if (typeof(cookie_str) == "string")
                cookie = JSON.parse(cookie_str);
        //     console.log("names before", names);
            delete cookie.pseudonyms[name];
        //     console.log("names after", names);
            cookie_str = JSON.stringify(cookie);
            $.cookie('bringy', cookie_str, {expires:7, path:"/"});
        },

        upgrade_cookie: function()
        {
            agent_url = "http://agents.brin.gy/retrieve_secret";
            
            cookie_str = $.cookie('other_names', {path:"/"});
            if (cookie_str && typeof(cookie_str) == "string"){
                
                console.log("bringy cookie before:", this.get_cookie());
                cookie_str = $.cookie('other_names', {path:"/"});
                
                cookie = JSON.parse(cookie_str);
                console.log("other_names", cookie, cookie_str);
                for (user in cookie) {
                    $.getJSON(agent_url, {user:user}, function(json){
                        console.log("got back from retrieve_secret:", json.user, json.stored_secret);
                        this.set_cookie(json.user, json.stored_secret);
                        console.log("bringy cookie after:", this.get_cookie());
                    });
                }
            } else
                console.log("other_names not found in cookie, good.");
        },
    },

    doLogin: function(username, password) {
        var that = this;
        var data = {user:username, secret:password};
        var url = this.agent.baseUrl()+'/authenticate_user';
        $.getJSON(url, data, function(json){
            if (json.result) {
                var pwd = password;
                var email = json.email;
                var info = {pwd:pwd, email:email, name:username};
                that.agent.addUserInfo(info);
                that.agent.setAgentId( username );
                that.cookies.set_cookie(username, password, json.email);
                // that.stats('signin', username);
                that.trigger('login');
            } else {
                $('div.alert')
                    .removeClass('alert-success')
                    .addClass('alert-error')
                    .html('Wrong username/email or password.')
                    .slideDown();
                setTimeout(function(){
                    $('div.alert').fadeOut();
                }, 3000);
            }
        });
        return false;
    },

    doCreate: function(username, email) {
        var that = this;
        var url = this.agent.baseUrl();
        $.post(url, {username:username, email:email}, function(json){
            if (json.error.length>0) {
                that.$('div.alert')
                    .html('User '+username+' already exists.')
                    .slideDown();
                setTimeout(function(){
                    that.$('div.alert').fadeOut();
                }, 3000);
                return false;
            } else {
                that.agent.setAgentId( username );
                var pwd = json.secret;
                var email = email;
                var info = {pwd:pwd, email:email, name:username};
                that.agent.addUserInfo(info);
                that.cookies.set_cookie(username, json.secret, email);
                // that.state.stats('signup', username);
                that.trigger('signedup');
            }
        }, 'json');
        
        return false;
    },

    doReminder: function(email) {
        var that = this;
        var data = {email:email};
        var url = this.agent.baseUrl()+'/email_reminder';
        $.post(url, data, function(json){
            if (json.error) {
                $('div.alert')
                    .removeClass('alert-success')
                    .addClass('alert-error')
                    .html('Email address not found.')
                    .slideDown();
                setTimeout(function(){
                    $('div.alert').fadeOut();
                }, 3000);
            } else {
                // that.stats('reminder', email);
            }
        }, 'json');
        
        $('div.alert')
            .addClass('alert-success')
            .removeClass('alert-error')
            .html('Email reminder sent successfully.')
            .slideDown();
        setTimeout(function(){
            $('div.alert').fadeOut();
        }, 3000);

        return false;
    },

    doDelete: function(){
        if (!this.agent.loggedIn()) return;

        var that = this;
        var username = this.agent.id();
        var data = {secret: this.agent.fullInfo().pwd};
        var url = this.agent.url();

        $.ajax({
            type: 'DELETE',
            url: url,
            data: data,
            dataType: 'json',
        }).done(function( json ) {
            that.agent.unsetAgentId();
            that.agent.removeUserInfo(username);
            that.cookies.del_cookie(username);
            
            $('div.alert')
                .addClass('alert-success')
                .removeClass('alert-error')
                .html('Username deleted successfully.')
                .slideDown();
            setTimeout(function(){
                $('div.alert').fadeOut();
            }, 3000);

            that.trigger('deleted');
        });

        return false;
    },

    mutateKeyValue: function(options) {
        if (options.type == undefined)
            options.type = 'POST';
        if (options.context == undefined)
            options.context = this.context.name;

        // console.log(options);

        var url = this.agent.url()+'/profile';
        var data = JSON.stringify([[options.key, options.val]]);
        if (options.type != 'POST' && options.type != 'DELETE')
            return false;

        var that = this;
        // var context_details = {
        //     description: that.context.descr, 
        //     location: {
        //         lat: 0,
        //         lon: 0,
        //         radius: 0,
        //     },
        //     expiration: 123,
        // };

        $.ajax({
            type: options.type,
            url: url,
            data: {data:data, 
                    context:options.context, 
                    // context_details: JSON.stringify(context_details),
                    secret:this.agent.fullInfo().pwd,
                    // contextDescription:that.context.descr
                },
            success: function(json){ 
                if (options.clb != undefined)
                    options.clb(json);
            },
            dataType: "json",
        });
    },
};

_.extend(state, Backbone.Events);

return {
    getState: function () { return state; }
};
});