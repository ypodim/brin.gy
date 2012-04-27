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
    'USER:contexts' # set of contexts in which USER participates
    'context:users:CONTEXT' # set of users participating in CONTEXT
    'context:description:CONTEXT' # a description of CONTEXT
    
    
    def add_reverse(self, context, key, val):
        if self.db.sadd(getKA(context, key), self.usr):   # add agent to set for this key
            self.db.zincrby(getK(context), key, 1)     # add key and increase its score
            
        if self.db.sadd(getKVA(context, key, val), self.usr):  # add agent to set for this key/val pair
            self.db.zincrby(getKV(context, key), val, 1)     # add key/val pair and increase its score
        
    def del_reverse(self, context, key, val):
        if self.db.srem(getKVA(context, key, val), self.usr):  # remove agent from set for this key/val pair
            if self.db.zincrby(getKV(context, key), val, -1) <= 0: # decrease key/val pair's score    
                self.db.zrem(getKV(context, key), val)
                self.db.delete(getKVA(context, key, val))
        
        key_is_stale = True
        for v in self.db.zrevrangebyscore(getKV(context, key), '+inf', '-inf'):
            v = unicode(v, errors='replace')
            if self.db.sismember(getKVA(context, key, v), self.usr): # if user has no more vals in this key
                key_is_stale = False
            
        if key_is_stale:
            if self.db.srem(getKA(context, key), self.usr):   # remove agent from set for this key
                if self.db.zincrby(getK(context), key, -1) <= 0: # decrease key's score
                    self.db.zrem(getK(context), key)
                    self.db.delete(getKA(context, key))
        
        user_left_context = True
        for k in self.db.zrevrangebyscore(getK(context), '+inf', '-inf'):
            k = unicode(k, errors='replace')
            if self.db.sismember(getKA(context, k), self.usr):
                user_left_context = False
            
        if user_left_context:
            print 'also removing from context', self.usr, context
            self.db.srem('%s:contexts' % self.usr, context)
            self.db.srem('context:users:%s' % context, self.usr)
            
            if self.db.scard('context:users:%s' % context) == 0 and context != 'all':
                print 'also removing context', context
                self.db.srem('contexts', context)

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
        self.db.sadd('contexts', context)
        self.db.sadd('%s:contexts' % self.usr, context)
        self.db.sadd('context:users:%s' % context, self.usr)
        
        self.set_key(key)
        self.add_reverse(context, key, val)
        return self.db.sadd('%s:profile:key:%s' % (self.usr, key), val)
    
    def del_val(self, context, key, val):
        self.del_reverse(context, key, val)

        kv_exists_in_other_contexts = ''
        if self.db.sismember('%s:profile:key:%s' % (self.usr, key), val):
            for cntx in self.db.smembers('%s:contexts' % self.usr):
                print 'looking in', cntx, (cntx != context), self.usr, getKVA(cntx, key, val)

                ismember = self.db.sismember(getKVA(cntx, key, val), self.usr)
                if cntx != context and ismember:
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
            for val in self.get_vals(key):
                saved_items.append(dict(key=key, val=val))
        res = {'data':saved_items, 'user':self.usr}
        self.finish( res )
        
    def post(self, context):        
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
        # print 'arguments', self.arguments

        for key, val in self.arguments:
            if type(key) == str:
                key = unicode(key, errors='replace')
            if type(val) == str:
                val = unicode(val, errors='replace')
            
            self.db.sadd('churn:%s:keys' % self.cap, key)
            self.db.sadd('churn:%s:%s:vals' % (self.cap, key), val)
            self.db.incr('churn:%s:%s:%s:add' % (self.cap, key, val))
            
            self.set_val(context, key, val)
            if context != 'all':
                self.set_val('all', key, val)
        
        return {'result':res, 'data':self.arguments, 'error':''}
    
    def delete(self, context):
        #print 'DELETE', self.usr, self.path, self.arguments
        error = ''
        for key, val in self.arguments:
            #key = unicode(key, errors='replace')
            #print 'deleting', key, val
            if type(key) == str:
                key = unicode(key, errors='replace')
            if type(val) == str:
                val = unicode(val, errors='replace')

            self.db.sadd('churn:%s:keys' % self.cap, key)
            self.db.sadd('churn:%s:%s:vals' % (self.cap, key), val)
            self.db.incr('churn:%s:%s:%s:rem' % (self.cap, key, val))
            
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

        self.db.srem('%s:contexts' % self.usr, context)
        self.db.srem('context:users:%s' % context, self.usr)
        
        if self.db.scard('context:users:%s' % context) == 0 and context != 'all':
            print 'also removing context', context
            self.db.srem('contexts', context)
