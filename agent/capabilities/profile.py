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
        self.context = 'all'
    
    'churn:CAP:keys' # set of recorded keys in churn
    'churn:CAP:KEY:vals' # set of recorded vals for each key in churn
    'churn:CAP:KEY:VAL:add' # counter of adds a key/val has received
    'churn:CAP:KEY:VAL:rem' # counter of rems a key/val has received
    
    #'profile:CONTEXT:keys' # set of all keys in use
    #'profile:CONTEXT:key:KEY' # set of agents using this key
    #'profile:CONTEXT:key:KEY:val:VAL' # set of agents using this key/val pair
    
    #'profile:CONTEXT:keyscores' # set of keys, scored on the number of agents that have it
    #'profile:CONTEXT:keyvalscores:KEY' # set of vals corresponding to this key, scored on the number of agents that have it
    
    'USER:profile:visited:keys' # set keys that USER has already seen
    'USER:profile:visited:key:KEY' # set of vals for the given KEY that USER has already seen
    
    'USER:profile:keys' # set of keys
    'USER:profile:key:KEY' # val
    
    'profile:CONTEXT:keys' # ordered set of all keys in use
    'profile:CONTEXT:key:KEY:agents' # set of agents using this key
    'profile:CONTEXT:key:KEY:values' # ordered set of values for this key
    'profile:CONTEXT:key:KEY:val:VAL:agents' # set of agents using this key/val pair
    
    'contexts' # set of all contexts available
    'USER:contexts' # set of contexts to which USER participates in
    'context:CONTEXT' # set of users participating in CONTEXT
    
    def getK (self):            return 'profile:%s:keys'                 % (self.context)
    def getKA(self, key):       return 'profile:%s:key:%s:agents'        % (self.context, key)
    
    def getKV(self, key):       return 'profile:%s:key:%s:values'        % (self.context, key)
    def getKVA(self, key, val): return 'profile:%s:key:%s:val:%s:agents' % (self.context, key, val)
    
    def add_reverse(self, key, val):
        if self.db.sadd(self.getKA(key), self.usr):   # add agent to set for this key
            self.db.zincrby(self.getK(), key, 1)     # add key and increase its score
            
        if self.db.sadd(self.getKVA(key, val), self.usr):  # add agent to set for this key/val pair
            self.db.zincrby(self.getKV(key), val, 1)     # add key/val pair and increase its score
        
        
    def del_reverse(self, key, val):
        if self.db.srem(self.getKVA(key, val), self.usr):  # remove agent from set for this key/val pair
            if self.db.zincrby(self.getKV(key), val, -1) <= 0: # decrease key/val pair's score    
                self.db.zrem(self.getKV(key), val)
                self.db.delete(self.getKVA(key, val))
                
        if self.db.srem(self.getKA(key), self.usr):   # remove agent from set for this key
            if self.db.zincrby(self.getK(), key, -1) <= 0: # decrease key's score
                self.db.zrem(self.getK(), key)
                self.db.delete(self.getKA(key))
        
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
        

        

            
