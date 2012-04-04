define([
    'jquery',
    'underscore', 
    'backbone', 
    'models/attribute'
  ], function($, _, Backbone, Attr){
	  
	var attrCollection = Backbone.Collection.extend({

    model: Attr,
    initialize: function(models, options) {
        _.bindAll(this, 'modelChange');
        // this.bind('add', this.added);
        this.bind('remove', this.removed);
    },

    modelChange: function(model) {
        var selectedlist = this.filter(function(attr){
            return attr.get('selected');
        });
        var melist = this.filter(function(attr){
            return attr.get('haveit');
        });

        var count = selectedlist.length;
        var html = (count > 0) ? count : '';
        var badge = $('#searchBadge').html(html);
        (count)? badge.show() : badge.hide();
        this.state.filterCount = count;

        count = melist.length;
        html = (count > 0) ? count : '';
        badge = $('#meBadge').html(html);
        (count)? badge.show() : badge.hide();
    },

    ffetch: function() {
        this.reset();
        this.state.progress('fetching attributes');
        $('#progressbar').children().width('10%');

        var that = this;
        url = this.state.satellite.url+"/profile/"+this.state.context.context+"/keyvals";
        $.getJSON(url, {user:this.state.user.name}, function(json){

            that.state.progress('fetched '+json.items.length+' attribute groups');
            for (i in json.items) {
                var key = json.items[i].key;
                var score = json.items[i].score;

                for (j in json.items[i].values) {
                    val = json.items[i].values[j].val;
                    cnt = json.items[i].values[j].score;
                    haveit = (json.items[i].values[j].userhasit==1);
                    newval = true;

                    var attr = new Attr({
                        key:key,
                        val:val,
                        kcnt:parseInt(score), 
                        vcnt:parseInt(cnt), 
                        selected:false,
                        display:true,
                        haveit:haveit, 
                        matches:{},
                        new:newval,
                    });
                    attr.bind('change', that.modelChange)
                    that.add(attr);
                }

                progress = parseInt(100*i/json.items.length)+'%';
                $('#progressbar').children().width(progress);
            }
            
            that.state.hideSplash();
            that.modelChange();
        });
    },

    added: function(obj) {
        console.log('added', obj);

        dic = [obj.get('key'), obj.get('val')];
        secret = '';
        username = 'ypodim';
        url = this.state.agent.baseurl+'/'+this.state.user.name+'/profile';
        data = {secret:secret, data:JSON.stringify(dic)};

        console.log('posting', url, data, secret);

        // $.post(url, data, function(json){
        //     console.log('post', json);
        // }, 'json');
    },
    removed: function(obj) {
        console.log('removed', obj);
    },

    byKey: function(key) {
        return this.filter(function(attribute){ return (attribute.get('key') == key); });
    },

    haveit: function() {
        return this.filter(function(attribute){ return attribute.get('haveit'); });
    },

    selected: function() {
        return this.filter(function(attribute){ return attribute.get('selected'); });
    },

    remaining: function() {
        return this.without.apply(this, this.done());
    },

    byCnt: function(descending) {
        if (descending==undefined)
            descending = -1;

        return this.sortBy(function(model){
            return descending * model.get('cnt');
        });
    },

  });
  return attrCollection;
});
