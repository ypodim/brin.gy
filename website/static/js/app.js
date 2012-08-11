define(['jquery','backbone','underscore','cookie'], function ($, Backbone, _, cookie) {
var state = {
    agent: {
        _baseurl: '',
        _agentid: '',
        _usernames: {},
        _options: {},
        url: function(){
            return this._baseurl+"/"+this._agentid;
        },
        baseUrl: function(){
            return this._baseurl;
        },
        setBaseUrl: function(url){ this._baseurl = url; },
        setAgentId: function(aid){ this._agentid = aid; },
        unsetAgentId: function(aid){ this._agentid = ''; },
        loggedIn: function(options) { 
            var loggedin = (this._agentid != '');
            if (!loggedin && options && options.alert)
                alert('Please sign in first.')

            return loggedin;
        },
        id: function() { return this._agentid; },

        setUserInfo: function(info){
            this._usernames[info.name] = info;
        },
        loadUserOptions: function(clb){
            var url = this.url();
            var data = {secret: this.fullInfo().pwd};
            var that = this;
            $.getJSON(url, data, function(json){
                that._options = json.options;
                clb && clb(json);
            });
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
    _context: {
        id:null,
        title:null,
        description:null,
    },

    setConfig: function(config) {
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
            this.agent.setUserInfo(info);
            this.agent.setAgentId( username );
        }

        // console.log('context in cookie', cookie.last_context);
        if (!cookie.last_context) {
            cookie.last_context = {title:'all'};
            this.cookies.set_context_in_cookie(cookie.last_context);

            // this.setContextTitle(cookie.last_context);
        }
    },

    setContext: function(cdic) {
        this._context.id = cdic.id;
        this._context.title = cdic.title;
        this._context.description = cdic.description;
        this._context.lid = cdic.lid;
        this._context.location = cdic.location;
        this._context.expiration = cdic.expiration;
    },

    getContext: function(){
        return this._context;
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

    getAllLocations: function(clb){
        var url = this.satellite.url+'/location';
        $.getJSON(url, {}, function(json){
            clb && clb(json);
        });
    },
    getContexts: function(clb) {
        var url = this.satellite.url+'/contexts';
        $.getJSON(url, {user:this.agent.id()}, function(json){
            clb && clb(json);
        });
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
                that.agent.setUserInfo(info);
                that.agent.setAgentId( username );
                that.cookies.set_cookie(username, password, json.email);
                // that.stats('signin', username);
                that.trigger('loggedin');
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
                that.agent.setUserInfo(info);
                that.cookies.set_cookie(username, json.secret, email);
                // that.state.stats('signup', username);
                that.trigger('signedup');
            }
            that.loginView.close();
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

    doFeedback: function(text) {
        var that = this;
        var url = this.agent.baseUrl() + '/feedback';
        var data = {username:this.agent.id(), feedback:text, secret: this.agent.fullInfo().pwd};

        $.post(url, data, function(json){
            console.log(json);
        }, 'json');
        
        return false;
    },

    mutateKeyValue: function(options) {
        if (options.type == undefined)
            options.type = 'POST';
        // if (options.context == undefined)
            // options.context = this.context.title;

        var url = this.agent.url()+'/profile';
        // var data = JSON.stringify([[options.key, options.val]]);
        var obj = {key:options.key, val:options.val, xdata:options.xdata};
        var data = JSON.stringify([obj]);
        if (options.type != 'POST' && options.type != 'DELETE')
            return false;

        var that = this;
        $.ajax({
            type: options.type,
            url: url,
            data: {data:data, 
                    context: JSON.stringify(that.getContext()), 
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

    postNewContext: function(options, clb){
        var url = this.satellite.url+'/contexts';
        var data = {
            context: JSON.stringify(options),
            action: 'newcontext',
            username: this.agent.id(),
            secret: this.agent.fullInfo().pwd,
        };
        $.post(url, data, function(json){
            clb && clb(json);
        }, 'json');
    },

    getKeyvals: function(clb){
        if (! this.getContext()) {
            console.log('ERROR: context not set, cannot get keyvals');
            return;
        }
        var url = this.satellite.url+"/profile/"+this.getContext().title+"/keyvals";
        $.getJSON(url, {user:this.agent.id()}, clb);
    },

    saveOption: function(options){
        var url = this.agent.url();
        var data = {
            options: JSON.stringify(options),
            action: 'options',
            secret: this.agent.fullInfo().pwd,
        };

        $.post(url, data, function(json){
            // console.log(json);
        }, 'json');
    },
};

_.extend(state, Backbone.Events);

return {
    getState: function () { return state; }
};
});