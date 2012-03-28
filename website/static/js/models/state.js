
define(['underscore', 'backbone',
    // 'collections/attributes',
    'collections/persons',
    ], function(_, Backbone, Persons) {
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

    hideSplash: function(){
        $('#container').show();
        $('#controls').show();
        $('#loader').hide();
    },
    });
    return stateModel;
});
