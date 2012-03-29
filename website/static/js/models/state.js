
define(['underscore', 'backbone',
    // 'collections/attributes',
    // 'collections/persons',
    ], function(_, Backbone) {
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

    isLoggedin: function() {
        var loggedin = (this.user.name!='' && this.user.pwd!='');
        if (!loggedin)
            this.router.navigate('#login', {trigger:true});
        return loggedin;
    },

    getMatches: function(clb) {
        var cap = 'profile';
        var context = 'all';
        var query = [];
        var selectedlist = this.attrCollection.filter(function(attr){
            return attr.get('selected');
        });
        _.each(selectedlist, function(model){
            query.push([cap, model.get('key'), model.get('val')]);
        });
        
        var data = JSON.stringify(query);
        var that = this;
        $.post(this.satellite.url+"/multimatch", {data:data, context:context}, function(json){
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

    mutateKeyValue: function(key, val, type, clb) {
        var url = this.agent.baseurl+'/'+this.user.name+'/profile';
        var data = JSON.stringify([[key, val]]);
        if (type != 'POST' && type != 'DELETE')
            return false;

        $.ajax({
            type: type,
            url: url,
            data: {data:data, secret:this.user.pwd},
            success: function(json){ 
                if (clb != undefined)
                    clb(json);
            },
            dataType: "json",
        });
    },

    stats: function(type, arg) {
        var stat = {};
        if (type == 'filters') {
            stat = {
                type:type,
                filters:[],
                user:this.user.name,
            };
            this.attrCollection.each(function(attribute){ 
                if (attribute.get('selected'))
                    stat.filters.push({
                        key:attribute.get('key'),
                        val:attribute.get('val'),
                    });
            });
            console.log('STATS:', type, stat);
        }

        if (type == 'newattrbtnTop' || type == 'newattrbtnBottom') {
            stat = {
                type:type,
                user:this.user.name,
            };
            console.log('STATS:', type, stat);
        }

        if (type == 'profile') {
            stat = {
                type:type,
                user:this.user.name,
                targetUser: arg,
            };
            console.log('STATS:', type, stat);
        }

        url = this.agent.baseurl+'/stats';
        console.log(url);
        $.post(url, stat, function(json){
            console.log('STATS RES', json)
        }, 'json');
    },

    hideSplash: function(){
        $('#container').show();
        $('#controls').show();
        $('#loader').hide();
    },
    });
    return stateModel;
});
