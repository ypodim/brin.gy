# -*- coding: utf-8 -*-
import tornado.escape
import tornado.httpclient

from urllib import urlencode

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
    
    'profile:keys' # set of all keys in use
    'profile:key:KEY' # set of agents using this key
    'profile:key:KEY:val:VAL' # set of agents using this key/val pair
    
    'profile:keyscores' # set of keys, scored on the number of agents that have it
    'profile:keyvalscores:KEY' # set of vals corresponding to this key, scored on the number of agents that have it
    
    'USER:profile:visited:keys' # set keys that USER has already seen
    'USER:profile:visited:key:KEY' # set of vals for the given KEY that USER has already seen
    
    'USER:profile:keys' # set of keys
    'USER:profile:key:KEY' # val
    
    
    def add_reverse(self, key, val):
        added = self.db.sadd('profile:keys', key)
        self.db.sadd('profile:key:%s' % key, self.usr)
        keyvaladded = self.db.sadd('profile:key:%s:val:%s' % (key, val), self.usr)
        
        if added:
            print 'add keyscore for', key
            self.db.zadd('profile:keyscores', key, 1)
        else:
            self.db.zincrby('profile:keyscores', key, 1)
        
        #if self.db.zscore('profile:keyvalscores:%s' % key, val) == None:
            #self.db.zadd('profile:keyvalscores:%s' % key, val, 1)
        #else:
        if keyvaladded:
            self.db.zincrby('profile:keyvalscores:%s' % key, val, 1)
        
    def del_reverse(self, key, val):
        self.db.srem('profile:key:%s:val:%s' % (key, val), self.usr)
        self.db.srem('profile:key:%s' % key, self.usr)
        
        newscore = self.db.zincrby('profile:keyscores', key, -1)
        if newscore == 0:
            self.db.srem('profile:keys', key)
            self.db.zrem('profile:keyscores', key)
        
        newscore = self.db.zincrby('profile:keyvalscores:%s' % key, val, -1)
        if newscore == 0:
            self.db.zrem('profile:keyvalscores:%s' % key, val)
        
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
    
    def set_val(self, key, val):
        self.set_key(key)
        self.add_reverse(key, val)
        return self.db.sadd('%s:profile:key:%s' % (self.usr, key), val)
    
    def del_val(self, key, val):
        self.del_reverse(key, val)
        res = self.db.srem('%s:profile:key:%s' % (self.usr, key), val)
        if res:
            if not self.get_vals(key):
                self.db.delete('%s:profile:key:%s' % (self.usr, key))
                self.del_key(key)
        return res
    
    def clear_all(self):
        for key in self.get_keys():
            for val in self.get_vals(key):
                self.del_val(key, val)
        
    def get(self):
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
            for val in self.get_vals(key):
                saved_items.append(dict(key=key, val=val))
        res = {'data':saved_items, 'user':self.usr}
        self.finish( res )
        
    def post(self):
        if self.path[-1] == 'visited':
            res = 0
            for key in self.arguments:
                lst = self.arguments[key]
                self.db.sadd('%s:profile:visited:keys' % self.usr, key)
                self.db.sadd('%s:profile:visited:key:%s' % (self.usr, key), *lst)
                res += len(lst)
            res = {'result':res, 'error':''}
            return res
            
        res = ''
        #print 'arguments', self.arguments
        for key, val in self.arguments:
            #print 'saving', key, val
            
            self.db.sadd('churn:%s:keys' % self.cap, key)
            self.db.sadd('churn:%s:%s:vals' % (self.cap, key), val)
            self.db.incr('churn:%s:%s:%s:add' % (self.cap, key, val))
            
            self.set_val(key, val)
        
        return {'result':res, 'data':self.arguments, 'error':''}
    
    def delete(self):
        error = ''
        for key, val in self.arguments:
            #key = unicode(key, errors='replace')
            #print 'deleting', key, val
            
            self.db.sadd('churn:%s:keys' % self.cap, key)
            self.db.sadd('churn:%s:%s:vals' % (self.cap, key), val)
            self.db.incr('churn:%s:%s:%s:rem' % (self.cap, key, val))
            
            if key and val:
                res = '%s' % self.del_val(key, val)
            else:
                error = 'invalid key/val: %s/%s' % (key, val)
            
        return dict(result='deleted ok', error=error)
        

        

            
