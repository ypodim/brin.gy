/*
 * Load scripts
 */
['util.js','data.js','sidebar.js','viz.js','popup.js'].map(
  function(url) { document.write(
    '<script type="text/javascript" src="'+JS_PRE+url+'"></script>');
  });


/*
 * init
 */
$(function() {
  Viral.ajax_load_data(function(){
    Viral.event.fire('DATA_loaded');
    Viral.init_flag = false;
    Viral.data.selectTag(Viral.data.all_tags[
	  Math.floor(Viral.data.all_tags.length / 2)]);
    Viral.event.fire('LOAD_complete');
    $('#new-tag').click();
   });
});

/*
 * Data Structures
 */
Viral = {
 init_flag: true,
 event: {
  evm: $('<div></div>'), // for firing events
  fire: function() {
   this.evm.triggerHandler.call(this.evm, arguments[0],
				Array.prototype.slice.call(arguments,1));
  },
  bind: function() {
   this.evm.bind.apply(this.evm, arguments);
  },
  unbind: function() {
   this.evm.unbind.apply(this.evm, arguments);
  }
 }
};
