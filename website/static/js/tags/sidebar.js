/*
 * basic functionality
 */
Viral.sidebar = {
 tag_els: {}
};

$(function() {
  $.extend(Viral.sidebar, { content: $('#tags-content') });
 });


/*
 * event hooks
 */
Viral.event.bind('DATA_person_changed', function(evt, username) {
    $('#corner .name').text(username);
    $('#corner .photo').css('background-image',
        'url(http://pldb.media.mit.edu/face/' + username + ')');
 });

Viral.event.bind('DATA_tag_added', function(evt, tag) {
  var tag_el = $('<div class="tag enabled"><a class="close">x</a>' +
	    '<span class="tag-value">' + tag + '</span></div>');
  tag_el.data('tag', tag);
  
  tag_el.children('a').bind('click', function(e) {
    var t = $(this).parent().data('tag');
    Viral.popup.showConfirm('Remove <b>'+t+'</b> from your tags?',
			    Viral.data.removeTag, null, Viral.data, t);
    e.stopPropagation();
   });
  
  tag_el.bind('click', function(e) {
    Viral.data.selectTag($(this).data('tag'));
    e.stopPropagation();
   });
  
  tag_el.hide();
  Viral.sidebar.content.prepend(tag_el);
  Viral.sidebar.tag_els[tag] = tag_el;
  tag_el.animate({ opacity:'show', height:'show', margin:'show' });
 });

Viral.event.bind('DATA_tag_removed', function(evt, tag) {
    var tag_el = Viral.sidebar.tag_els[tag];
    tag_el.animate({ opacity:'hide', height:'hide', margin:'hide' },
		   function(){ tag_el.remove(); });
    delete Viral.sidebar.tag_els[tag];
 });
 
Viral.event.bind('DATA_tag_selected', function(evt, tag) {
  if (Viral.sidebar.active_tag) {
   Viral.sidebar.active_tag.removeClass('active');
   delete Viral.sidebar.active_tag;
  }
  if (tag) {
   var tag_el = Viral.sidebar.tag_els[tag];
   if (tag_el) {
    tag_el.addClass('active');
    Viral.sidebar.active_tag = tag_el;
   }
  }
 });


/*
 * New Tag Behavior
 */
$(function() {

  var new_tag = $('#new-tag');
  var new_tag_input = $('#new-tag input');
  
  // add tag
  function add_tag() {
    var val = new_tag_input.val();
    if (val != '') Viral.data.addTag(val);
    new_tag_input.hide();
    Viral.event.fire('DATA_tag_selected', val)
  };
  
  // click
  new_tag.bind('click', function() {
    Viral.sidebar.tag_flag = false;
    if (new_tag_input.css('display') == 'none') {
      new_tag_input.val('');
      new_tag_input.show();
      new_tag_input.focus();
    } else {
      add_tag();
    }
  });
  new_tag_input.bind('click', function(evt) { evt.stopPropagation(); });
  
  // blur
  new_tag_input.bind('focusout', function(evt) {
    if (!Viral.sidebar.tag_flag) new_tag_input.hide();
  });
  new_tag.bind('mousedown', function() { Viral.sidebar.tag_flag = true; });
  new_tag_input.bind('mousedown', function(evt) { evt.stopPropagation(); });
  
  // keys
  new_tag_input.bind('keyup', function(evt) {
    if (evt.which == '13') add_tag(); // <ret>
    else if (evt.which == '27') {  // <esc>
     new_tag_input.hide();
     Viral.sidebar.tag_flag = false;
    } else {
     var v = new_tag_input.val().toLowerCase();
     if (v == '') return;
     
     // FIXME: make less expensive
     var guess = '';
     for (var i = 0; i < Viral.data.all_tags.length; i++) {
      var s = Viral.data.all_tags[i].toLowerCase();
      if (s.indexOf(v) != -1 &&
	  (s.length < guess.length || !guess)) {
       guess = s;
      }
     }
     Viral.data.selectTag(guess);
     
     //Viral.data.selectTag(Viral.data.all_tags[Viral.data.findTagIndex(v, true)]);
    }
  });
});

