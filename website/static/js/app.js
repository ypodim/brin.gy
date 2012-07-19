define(['jquery','backbone','underscore','cookie'], function ($, Backbone, _, ck) {
var state = {
    agent: {},
    usernames: {},

    setConfig: function(config) {
        this.config = config;
        this.satellite = {};
        this.satellite.url = config.discov_url;
        this.agent = {};
        this.agent.id = config.agentid;
        this.agent.baseurl = config.ego_url_prefix;
        this.agent.url = config.ego_url_prefix+"/"+config.agentid;
        this.website_url = config.website_url_prefix;
        this.device = config.device;
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
        var url = this.agent.baseurl+'/authenticate_user';
        $.getJSON(url, data, function(json){
            if (json.result) {
                that.usernames[username] = {
                    name: username,
                    pwd: password,
                    email: json.email,
                };
                that.user = username;
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
        var url = this.agent.baseurl;
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
                that.user = username;
                that.usernames[username] = {
                    name: username,
                    pwd: json.secret,
                    email: email,
                };
                that.cookies.set_cookie(username, json.secret, email);
                // that.state.stats('signup', username);
                that.trigger('signedup');
            }
        }, 'json');
        
        return false;
    },

    doReminder: function(email) {
        console.log('reminder:', email);
        var that = this;
        var data = {email:email};
        var url = this.agent.baseurl+'/email_reminder';
        $.post(url, data, function(json){
            console.log(json);
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
        console.log('delete', this.usernames);
        var that = this;
        var data = {secret: this.usernames[this.user].pwd};
        var url = this.agent.baseurl;
        $.ajax({
            type: 'DELETE',
            url: url,
            data: data,
            dataType: 'json',
        }).done(function( json ) {
            alert( "Data Saved: " + json );
        });
        return; 

        $.delete(url, data, function(json){
            console.log(json);
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
};

_.extend(state, Backbone.Events);

return {
    getState: function () { return state; }
};
});