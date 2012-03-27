
define(['underscore', 'backbone',
    // 'collections/attributes',
    'collections/persons',
    ], function(_, Backbone, Persons) {
    var stateModel = Backbone.Model.extend({

    filters: null,
    myattrs: null,
    // getter: function(type) {
    //     if (type=='filters') return this.filters;
    //     if (type=='myattrs') return this.myattrs;
    //     console.log('error: unknown type:', type)
    //     return undefined;
    // },

    initialize: function() {
        _.bindAll(this, 'toggle');
        // _.extend(this, Backbone.Events);

        // this.filters = new Attributes();
        // this.myattrs = new Attributes();
        // this.filters.state = this;
        // this.myattrs.state = this;
    },

    // toggle: function(attribute, type, flag) {
    //     // console.log('toggle', attribute, type, flag);
    //     var that = this;
    //     if (flag) {
    //         this.getter(type).add(attribute);
    //     } else {
    //         var flist = this.getter(type).filter(function(attr){
    //             return (attr.get('key')==attribute.key && attr.get('val')==attribute.val)
    //         });
    //         _.each(flist, function(model){
    //             that[type].remove(model);
    //         });
    //     }

    //     this.trigger('change:'+type, {attribute:attribute, flag:flag});
    // },

    });
    return stateModel;
});
