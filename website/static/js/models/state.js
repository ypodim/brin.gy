
define(['underscore', 'backbone', 'common/ego_website',
    // 'collections/attributes',
    // 'collections/persons',
    ], function(_, Backbone, common) {
    var stateModel = Backbone.Model.extend({

    filters: null,
    myattrs: null,
    matches: [],
    user: {name:'', pwd:''}, 


    initialize: function() {
        // _.bindAll(this, 'toggle');
    },

    progress: function(step) {
        console.log('step', step);
    },

    isLoggedin: function(options) {
        if (options == undefined)
            options = {redirect:true};
        var loggedin = (this.user.name && this.user.pwd);
        if ((!loggedin) && options.redirect)
            this.router.navigate('#signup', {trigger:true});
        return loggedin;
    },

    getMatches: function(clb) {
        var cap = 'profile';
        var query = [];
        var selectedlist = this.attrCollection.filter(function(attr){
            return attr.get('selected');
        });
        _.each(selectedlist, function(model){
            query.push([cap, model.get('key'), model.get('val')]);
        });
        
        var querystr = JSON.stringify(query);
        var that = this;
        var data = {data:querystr, context:this.context.name};
        // console.log(data);
        $.post(this.satellite.url+"/multimatch", data, function(json){
            if (json.error) {
                console.log('getMatches: error:', json.error);
                return false;
            }

            var target = json.matches.length;
            var test_intersection = {};
            for (var i in json.matches) {
                var cap = json.matches[i][0];
                var key = json.matches[i][1];
                var val = json.matches[i][2];
                var matches = json.matches[i][4];
                for (var m in matches) {
                    if (test_intersection[matches[m]] == undefined)
                        test_intersection[matches[m]] = 0;
                    test_intersection[matches[m]] += 1;
                }
            }

            var result = [];
            for (user in test_intersection)
                if (test_intersection[user] == target)
                    result.push(user);

            that.matches = result;
            if (clb != undefined) clb(result);
            that.trigger('matchesChanged');
        });
    },

    showMessage: function(msg) {
        $('div#message').html(msg).slideDown();
        setTimeout(function(){
            $('div#message').slideUp();
        }, 5000);
    },

    mutateKeyValue: function(options) {
        if (options.type == undefined)
            options.type = 'POST';
        if (options.context == undefined)
            options.context = this.context.name;

        // console.log(options);

        var url = this.agent.baseurl+'/'+this.user.name+'/profile';
        var data = JSON.stringify([[options.key, options.val]]);
        if (options.type != 'POST' && options.type != 'DELETE')
            return false;

        var that = this;
        $.ajax({
            type: options.type,
            url: url,
            data: {data:data, 
                    context:options.context, 
                    secret:this.user.pwd,
                    contextDescription:that.context.descr},
            success: function(json){ 
                if (options.clb != undefined)
                    options.clb(json);
            },
            dataType: "json",
        });
    },
    postMultiKeyVals: function(context, kvlist, clb){
        if (kvlist.length == 0)
            return false;
        var url = this.agent.baseurl+'/'+this.user.name+'/profile';
        var data = JSON.stringify(kvlist);
        var that = this;
        $.ajax({
            type: 'POST',
            url: url,
            data: {data:data, 
                    context:context.name, 
                    secret:this.user.pwd,
                    contextDescription:that.context.descr},
            success: function(json){ 
                if (clb != undefined)
                    clb(json);
            },
            dataType: "json",
        });
    },

    toggleContext: function(context, flag){
        var url = this.agent.baseurl+'/'+this.user.name;
        var data = {
            secret: this.user.pwd, 
            context: context, 
            action: (flag)?'join':'leave',
        };
        $.post(url, data, function(json){
            console.log(json);
        }, 'json');
    },

    stats: function(type, arg) {
        var url = this.agent.baseurl+'/stats';
        var stat = {
            type:type,
            user:this.user.name,
            body:'',
        };

        if (type == 'filters:filters') {
            var filters = [];
            this.attrCollection.each(function(attribute){ 
                if (attribute.get('selected'))
                    filters.push({
                        key:attribute.get('key'),
                        val:attribute.get('val'),
                    });
            });
            stat.body = JSON.stringify(filters);
        }

        if (type == 'newattrbtnTop' || type == 'newattrbtnBottom') {

        }

        if (type == 'profile') {
            stat.body = JSON.stringify(arg);
        }

        if (type == 'message:send') {
            stat.body = JSON.stringify(arg);
        }

        $.post(url, stat, 'json');
    },

    hideSplash: function(){
        // $('#container').show();
        // $('#controls').show();
        $('#loader').fadeOut();
    },

    setContext: function(context){
        this.context.name = context.name;
        this.context.descr = context.descr;
        common.cookies.set_context_in_cookie(context.name);
    },

    deleteAccount: function() {
        var url = this.agent.baseurl+'/'+this.user.name;
        var that = this;
        $.ajax({
            type:'DELETE',
            dataType:'json',
            data: {username:this.user.name, secret:this.user.pwd},
            success: function(json) {
                if (json.error.length) {
                    $('div.alert')
                        .html(json.error)
                        .slideDown();
                    setTimeout(function(){
                        $('div.alert').fadeOut();
                    }, 3000);
                    return false;
                } else {
                    common.cookies.del_cookie(that.user.name);
                    that.user = {};
                    that.router.navigate('#/all', {trigger: true});
                }
            },
            url:url,
        })
    },
    });
    return stateModel;
});
