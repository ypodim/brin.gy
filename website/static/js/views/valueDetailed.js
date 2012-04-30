define([
  'jquery', 
  'underscore', 
  'backbone',
  'text!templates/valueDetailed.html'
  ], function($, _, Backbone, valuesTemplate){
  var ValueView = Backbone.View.extend({

    className: 'valcontainer',
    template: _.template(valuesTemplate),

    events: {
        "click a.valpart"    : "toggleUsers",
        'click button#searchBtn'   : 'filterBtn',
        'click button#addBtn'      : 'addBtn',
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'filterBtn', 'addBtn');
      this.state = options.state;
      this.model.bind('destroy', this.remove);
      this.model.bind('change', this.render);
      this.parentView = options.parentView;
    },

    render: function() {
        var json = this.model.toJSON();
        $(this.el).html(this.template(json))
                  .addClass('slideValueUp')
                  .removeClass('slideValueDown');

        if (this.model.get('selected'))
            $(this.el).addClass('filterTag');
        
        var haveit = this.model.get('haveit');
        this.$('button#addBtn').toggleClass('btn-success', haveit);
        $(this.el).toggleClass('haveitTag', haveit);

        // this.$('span.count > span.cno').html(this.model.get('vcnt'));

        return this;
    },

    filterBtn: function(e) {
        this.model.set({selected: !this.model.get('selected')});
        $(this.el).toggleClass('filterTag');
        
        this.state.getMatches(this.matchesClb);
        e.stopPropagation();
        return false;
    },

    addBtn: function(e) {
        if (! this.state.isLoggedin())
            return false;

        haveit = this.model.get('haveit');

        var oldcount = this.model.get('vcnt');
        console.log(oldcount);
        if (haveit) 
            this.model.set({vcnt: oldcount-1});
        else
            this.model.set({vcnt: oldcount+1});

        this.model.set({haveit: !haveit});
        $(this.el).toggleClass('haveitTag');

        var key = this.model.get('key');
        var val = this.model.get('val');
        var type = (haveit) ? 'DELETE' : 'POST';

        this.state.mutateKeyValue({key:key, val:val, type:type});

        var body = {key:key, val:val, context:this.state.context.name};
        if (haveit)
            this.state.stats('attribute:removed', body)
        else
            this.state.stats('attribute:added', body)
        

        e.stopPropagation();
        return false;
    },

    toggleUsers: function(e){
        var key = this.model.get('key');
        var val = this.model.get('val');

        var url = this.state.satellite.url;
        url += '/profile/'+this.state.context.name;
        url += '/key/'+key+'/val/'+val+'/agents';

        if ($(this.el).hasClass('slideValueDown')) {
            // $(this.el).removeClass('slideValueDown');
            $(this.el).toggleClass('slideValueDown');
            $(this.el).toggleClass('slideValueUp');
            this.$('#matches').empty();
            return false;
        }

        var that = this;
        $.getJSON(url, function(json){
            that.$('#matches').empty();
            for (var i in json.items) {
                utoken = $('<a></a>').addClass('userToken').html(json.items[i]);
                utoken.attr('href','#/u/'+json.items[i]);
                that.$('div#matches').append(utoken);
            }
            $(that.el).toggleClass('slideValueDown');
            $(that.el).toggleClass('slideValueUp');
        })
        
        e.stopPropagation();
        return false; 
    },
  });
  return ValueView;
});