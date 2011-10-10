/*
 * Data structures
 */
Viral.data = {
 tags: [],
 person: '',
 people: [],
 all_tags: []
};


/*
 * Data handlers
 */
$.extend(Viral.data, {
 setPerson: function(person) {
   this.person = person;
   Viral.event.fire('DATA_person_changed', person);
 },
 
 setPeople: function(people) {
   this.people = people;
   Viral.event.fire('DATA_people_changed', people);  
 },
   
 tagComparator: function(x, y) {
   var x_ = x.toLowerCase();
   var y_ = y.toLowerCase();
   return x_ == y_ ?
    //x > y ? 1 : x < y ? -1 :
    0 : x_ < y_ ? -1 : 1;
  },
 
 setAllTags: function(all_tags) {
   // sort and uniquify the tag set
   var temp = all_tags.slice(0);
   temp.sort(this.tagComparator);
   this.all_tags = [temp[0]];
   var l = 0;
   var s = temp[0].toLowerCase();
   var r = '';
   for (var i = 1; i < temp.length; i++) {
    if (s != /*temp[i]) {*/ (r = temp[i].toLowerCase())) {
     this.all_tags.push(temp[i]);
     s = /*temp[i];*/ r;
     l++;
    }
   }
   Viral.event.fire('DATA_all_tags_changed', this.all_tags);
 },
 
 findTagIndex: function(tag, closest) {
   var v = tag;
   var l = 0, r = this.all_tags.length - 1;
   if (r == -1) return -1;
   while (l < r) {
    var mid = Math.floor((r + l) / 2);
    var c = this.tagComparator(v, this.all_tags[mid]);
    if (c == 0) return mid;
    else if (c > 0) l = mid + 1;
    else r = mid - 1;
   }
   var c = this.tagComparator(v, this.all_tags[l]);
   return c == 0 ? l : !closest ? -1 :
            (c > 0 && l+1 < this.all_tags.length) ? l+1 : l;
  },
 
 addTag: function(tag) {
   var i = -1;
   if ((i = this.findTagIndex(tag, false)) != -1) {
    tag = this.all_tags[i];
   }
   if (this.tags.indexOf(tag) == -1) { // FIXME: slow, do we care?
    if (i == -1) {
     // add new tag to full set
     this.all_tags.splice(this.findTagIndex(tag, true), 0, tag);
     Viral.event.fire('DATA_all_tags_changed', this.all_tags);
    }
    this.tags.push(tag);
    Viral.event.fire('DATA_tag_added', tag);
    Viral.event.fire('DATA_tags_changed', tag);
    
    if (!Viral.init_flag) {
     $.ajax({
       url: 'http://tagnet.media.mit.edu/'+Viral.data.person+'/tags/add_tag',
	data: { new_tag: tag },
	error: function(){ alert('Failed to add tag!'); },
	success: function(){ alert('Added tag!'); },
	type: 'POST'
	});
    }
   }
  },
 
 removeTag: function(tag) {
   var i = this.tags.indexOf(tag);
   if (i > -1) {
    this.tags.splice(i, 1);
    Viral.event.fire('DATA_tag_removed', tag);
    Viral.event.fire('DATA_tags_changed', tag);
    $.ajax({
      url: 'http://tagnet.media.mit.edu/'+Viral.data.person+'/tags/del_tag',
       data: { del_tag: tag },
       error: function(){ alert('Failed to remove tag!'); },
       success: function(){},
       type: 'POST'
       });
   }
  },
 
 selectTag: function(tag) {
   this.selection = tag;
   Viral.event.fire('DATA_tag_selected', tag);
  }
});



/*
 * Ajax handlers
 */
$.extend(Viral, {
  
  /*
   * data set handlers
   */
  get_people: function(data) {
   Viral.data.setPeople(data.res);
    //Viral.data.target = data.res[Math.floor(Math.random()*data.res.length)];
  },
  
  get_all_tags: function(data) {
   Viral.data.setAllTags(data.tags);
  },
  
  get_tags: function(data) {
    Viral.data.orig_tags = data.res;
    for (var i = 0; i < data.res.length; i++) {
      Viral.data.addTag(data.res[i]);
    }
  },
  
   /*
    * load manager
    */
  ajax_load_data: function(callback) {
   Viral.data.setPerson(USER);
   
   // error callback
   function ajax_error(msg) {
    return function(){
     Viral.ajax_error = true;
     alert(msg);
    };
   };
   
   // success callback
   Viral.ajax_total = 0;
   Viral.ajax_count = 0;
   function ajax_success(handler) {
    Viral.ajax_total++;
    return function(data, textStatus, xmlhr) {
     if (Viral.ajax_error) return;
     handler(data);
     Viral.ajax_count++;
     if (Viral.ajax_count == Viral.ajax_total)
      callback();
    };
   };
   
   // make the calls
   $.ajax({
     url: "http://tagnet.media.mit.edu/get_people?callback=?",
      dataType: "jsonp",
      success: ajax_success(Viral.get_people),
      error: ajax_error("Error retrieving people data!")
      });
   $.ajax({
    url: "http://tagnet.media.mit.edu/get_tags?callback=?",
      dataType: "jsonp",
      success: ajax_success(Viral.get_all_tags),
      error: ajax_error("Error retrieving all tags data!")
      });
   $.ajax({
     url: "http://tagnet.media.mit.edu/" + Viral.data.person + "/tags?callback=?",
      dataType: "jsonp",
      success: ajax_success(Viral.get_tags),
      error: ajax_error("Error retrieving tag data!")
      });
  }
});
