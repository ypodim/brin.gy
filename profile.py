# -*- coding: utf-8 -*-
import tornado.escape
import tornado.httpclient

from urllib import urlencode
from keys import *

class profile():
    def __init__(self, usr, arguments, path, db, finish):
        self.db = db
        self.finish = finish
        self.arguments = arguments
        self.cap = __name__.split('.')[-1]
        self.usr = usr
        self.path = path
    
    'churn:CAP:keys' # set of recorded keys in churn
    'churn:CAP:KEY:vals' # set of recorded vals for each key in churn
    'churn:CAP:KEY:VAL:add' # counter of adds a key/val has received
    'churn:CAP:KEY:VAL:rem' # counter of rems a key/val has received
    
    'USER:profile:visited:keys' # set keys that USER has already seen
    'USER:profile:visited:key:KEY' # set of vals for the given KEY that USER has already seen
    
    'USER:profile:keys' # set of keys
    'USER:profile:key:KEY' # val

    
    'global:nextcid' # holds next key id to be assigned to a context
    # 'global:nextvid' # holds next key id to be assigned to a complex key
    'profile:keytypes' # set of key types (string, location, time, user)
    'profile:key:KEY:type' # hash of key type fields (eg. loc:lat, lon, radius)
    'profile:composite:key:KEY:val:VAL' # vid that corresponds to a composite key/val
    'profile:vid:VID' # populated hash of key fields for value id VID

    'global:nextlid' # holds next location id to be assigned to a location
    'location:lid:LID' # location information hash for location id LID 
    'location:titles' # set of location names for easy title lookup
    'location:title:LOCATION' # set of location ids for a given location title LOCATION
    'location:latlonstrings' # set of location strings for easy lookup of existing lat/lons
    'location:latlonstring:LATLONSTR:lid' # location id for a given location string LATLONSTR

    'profile:CONTEXT:keys' # ordered set of all keys in use
    'profile:CONTEXT:key:KEY:agents' # set of agents using this key
    'profile:CONTEXT:key:KEY:values' # ordered set of values for this key
    'profile:CONTEXT:key:KEY:val:VAL:agents' # set of agents using this key/val pair
    

    'contexts' # set of all contexts available
    'USER:contexts' # set of contexts in which USER participates
    'context:cid:CID' # hash: id, title, description, expiration, lid
    'context:cid:CID:users' # set
    'context:title:CONTEXTTITLE:cid' # string

    'alert:on:everything:users' # set
    'alert:on:application:users' # set
    'alert:on:attribute:users' # set
    'alert:on:value:users' # set
    'USER:alerts'
    

    def add_reverse(self, context, key, val):
        if self.db.sadd(getKA(context, key), self.usr):   # add agent to set for this key
            self.db.zincrby(getK(context), key, 1)     # add key and increase its score
            
        if self.db.sadd(getKVA(context, key, val), self.usr):  # add agent to set for this key/val pair
            self.db.zincrby(getKV(context, key), val, 1)     # add key/val pair and increase its score
        
    def del_reverse(self, context, key, val):
        ctitle = context['title']
        cid = context['id']
        if self.db.srem(getKVA(ctitle, key, val), self.usr):  # remove agent from set for this key/val pair
            if self.db.zincrby(getKV(ctitle, key), val, -1) <= 0: # decrease key/val pair's score    
                self.db.zrem(getKV(ctitle, key), val)
                self.db.delete(getKVA(ctitle, key, val))
        
        key_is_stale = True
        for v in self.db.zrevrangebyscore(getKV(ctitle, key), '+inf', '-inf'):
            v = unicode(v, errors='replace')
            if self.db.sismember(getKVA(ctitle, key, v), self.usr): # if user has no more vals in this key
                key_is_stale = False
            
        if key_is_stale:
            if self.db.srem(getKA(ctitle, key), self.usr):   # remove agent from set for this key
                if self.db.zincrby(getK(ctitle), key, -1) <= 0: # decrease key's score
                    self.db.zrem(getK(ctitle), key)
                    self.db.delete(getKA(ctitle, key))
        
        user_left_context = True
        for k in self.db.zrevrangebyscore(getK(ctitle), '+inf', '-inf'):
            k = unicode(k, errors='replace')
            if self.db.sismember(getKA(ctitle, k), self.usr):
                user_left_context = False
            
        if user_left_context:
            print 'also removing from context', self.usr, ctitle
            self.db.srem('%s:contexts' % self.usr, ctitle)
            self.db.srem('context:cid:%s:users' % cid, self.usr)
            
            if self.db.scard('context:cid:%s:users' % cid) == 0 and ctitle != 'all':
                print 'also removing context', ctitle
                self.remove_context(context)

    def remove_context(self, context):
        self.db.srem('contexts', context['title'])
        self.db.delete('context:cid:%s' % context['id'])
        self.db.delete('context:cid:%s:users' % context['id'])
        self.db.delete('context:title:%s:cid' % context['title'])

    def add_context(self, context):
        print
        print 'add_context', context
        cid = context['id']
        if self.db.hgetall('context:cid:%s' % cid):
            print 'WARNING: add_context: cid already exists:', cid
            return cid
        else:
            if self.db.sismember('contexts', context['title']):
                print 'ERROR: add_context: context title already exists: cid:', self.db.get('context:title:%s:cid' % context['title'])
                return None

            lid = None
            ldic = context.get('location')
            if ldic:
                lres = add_location(self.db, 
                                    ldic.get('id'), 
                                    ldic['title'], 
                                    ldic['lat'], 
                                    ldic['lon'], 
                                    ldic['radius'], 
                                    ldic.get('creator',self.usr))
                lid = lres['lid']
                # self.db.set('context:%s:lid' % c, lid)

            cid = self.db.incr('global:nextcid')
            cdic = dict(id=cid,
                        title=context['title'], 
                        description=context['description'],
                        lid=lid)
            
            self.db.set('context:%s:cid' % context['title'], cid)
            self.db.hmset('context:cid:%s' % cid, cdic)
            self.db.set('context:title:%s:cid' % context['title'], cid)
            self.db.sadd('contexts', context['title'])
            return cid

    def get_keys(self):
        return self.db.smembers('%s:profile:keys' % self.usr)
    
    def set_key(self, key):
        return self.db.sadd('%s:profile:keys' % self.usr, key)
        
    def del_key(self, key):
        return self.db.srem('%s:profile:keys' % self.usr, key)
    
    def get_vals(self, key):
        if type(key) != unicode:
            key = unicode(key, errors='replace')
        return self.db.smembers('%s:profile:key:%s' % (self.usr, key))
    
    def set_val(self, context, key, val):
        # context is dictionary
        print 'set_val'
        print context, type(context)
        print key, val

        cid = self.add_context(context)
        if not cid:
            return None

        self.db.sadd('%s:contexts' % self.usr, context['title'])
        self.db.sadd('context:cid:%s:users' % cid, self.usr)
        
        self.set_key(key)
        self.add_reverse(context['title'], key, val)
        return self.db.sadd('%s:profile:key:%s' % (self.usr, key), val)
    
    def del_val(self, context, key, val):
        self.del_reverse(context, key, val)

        kv_exists_in_other_contexts = ''
        if self.db.sismember('%s:profile:key:%s' % (self.usr, key), val):
            for cntx in self.db.smembers('%s:contexts' % self.usr):
                print 'looking in', cntx, (cntx != context['title']), self.usr, getKVA(cntx, key, val)

                ismember = self.db.sismember(getKVA(cntx, key, val), self.usr)
                if cntx != context['title'] and ismember:
                    kv_exists_in_other_contexts = cntx

        res = 0
        if kv_exists_in_other_contexts:
            print 'kv', key, val, 'also exists in', kv_exists_in_other_contexts
        else:
            print 'kv', key, val, 'DOES NOT exist in other contexts'
            res = self.db.srem('%s:profile:key:%s' % (self.usr, key), val)

        if res:
            if not self.get_vals(key):
                print 'also deleting key', key
                self.db.delete('%s:profile:key:%s' % (self.usr, key))
                self.del_key(key)
            
                
                            
        return res
    
    def clear_all(self):
        for key in self.get_keys():
            print 'clearing key', key
            for val in self.get_vals(key):
                print 'clearing val', val
                for context in self.db.smembers('%s:contexts' % self.usr):
                    print 'clearing context', context
                    self.del_val(context, key, val)
        
    def get(self, context):
        if self.path[-1] == 'visited':
            visited_items = {}
            for key in self.db.smembers('%s:profile:visited:keys' % self.usr):
                vals = self.db.smembers('%s:profile:visited:key:%s' % (self.usr, key))
                visited_items[key] = {}
                for val in vals:
                    visited_items[key][val] = 1
            res = {'data':visited_items, 'user':self.usr}
            self.finish( res )
            return
            
        saved_items = []
        for key in self.get_keys():

            ktype = self.db.get('profile:key:%s:type' % key) or 'string'

            for val in self.get_vals(key):
                dic = dict(key=key, val=val)
                if ktype != 'string':
                    dic['xdata'] = getfullkv(self.db, context, key, val)
                saved_items.append(dic)
        res = {'data':saved_items, 'user':self.usr}
        self.finish( res )
        
    def post(self, context):
        print 'POST context', context
        print self.arguments

        if self.path[-1] == 'visited':
            res = 0
            for key in self.arguments:
                key = unicode(key, errors='replace')
                
                lst = self.arguments[key]
                print 'profile to add', lst, '-', key
                self.db.sadd('%s:profile:visited:keys' % self.usr, key)
                self.db.sadd('%s:profile:visited:key:%s' % (self.usr, key), *lst)
                res += len(lst)
            res = {'result':res, 'error':''}
            return res
            
        res = ''

        for attr in self.arguments:
            print 'profile POST:', attr
            if type(attr) == list:
                key, val = attr
            else:
                if not (('key' in attr) and ('val' in attr)):
                    print 'bad request:', attr
                    return {'result':'', 'data':self.arguments, 'error':'missing parameter key and/or val'}

                key = attr['key']
                val = attr['val']
                xdata = attr.get('xdata')
                if xdata:
                    print 'POST', attr, type(attr), xdata
                    print 'context', context
                    ktype = xdata['ktype']
                    title = xdata['title']
                    lat = xdata['lat']
                    lon = xdata['lon']
                    radius = xdata['radius']
                    creator = xdata['creator']

                    print 'id exists:', xdata.get('id')
                    res = add_location(self.db, 
                                       xdata.get('id'), 
                                       title, 
                                       lat, 
                                       lon, 
                                       radius, 
                                       creator)

                    lid = res['lid']
                    lid = int(lid)
                    dic = dict(lat=lat, 
                               lon=lon, 
                               radius=radius, 
                               creator=creator, 
                               title=title,
                               id=lid)
                    print 'dic', dic
                    annotate(self.db, key, val, ktype, dic)

            if type(key) == str:
                key = unicode(key, errors='replace')
            if type(val) == str:
                val = unicode(val, errors='replace')
            
            # self.db.sadd('churn:%s:keys' % self.cap, key)
            # self.db.sadd('churn:%s:%s:vals' % (self.cap, key), val)
            # self.db.incr('churn:%s:%s:%s:add' % (self.cap, key, val))
            
            self.set_val(context, key, val)
            if context['title'] != 'all':
                self.set_val(dict(title='all', id=1000), key, val)
        
        return {'result':res, 'data':self.arguments, 'error':''}
    
    def delete(self, context): 
        error = ''
        for attr in self.arguments:
            if type(attr) == list:
                key, val = attr
            else:
                key = attr['key']
                val = attr['val']

            #key = unicode(key, errors='replace')
            #print 'deleting', key, val
            if type(key) == str:
                key = unicode(key, errors='replace')
            if type(val) == str:
                val = unicode(val, errors='replace')

            # self.db.sadd('churn:%s:keys' % self.cap, key)
            # self.db.sadd('churn:%s:%s:vals' % (self.cap, key), val)
            # self.db.incr('churn:%s:%s:%s:rem' % (self.cap, key, val))
            
            if key and val:
                res = '%s' % self.del_val(context, key, val)
            else:
                error = 'invalid key/val: %s/%s' % (key, val)
            
        return dict(result='deleted ok', error=error)
        
    def leave_context(self, context):
        print 'LEAVING context', context, self.usr
        for key in self.db.smembers('%s:profile:keys' % self.usr):
            for val in self.db.smembers('%s:profile:key:%s' % (self.usr, key)):
                self.del_val(context, key, val)

        self.db.srem('%s:contexts' % self.usr, context['title'])
        self.db.srem('context:cid:%s:users' % context['id'], self.usr)
        
        if self.db.scard('context:cid:%s:users' % context['id']) == 0 and context != 'all':
            print 'also removing context', context
            self.remove_context(context)


