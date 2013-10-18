# -*- coding: utf-8 -*-
import time
from datetime import datetime
import redis
import random

from keys import *

class DB:
    def __init__(self, db=0):
        self.r = redis.Redis(host='brin.gy', port=23532, db=db)

    def generate_secret(self, username):
        secret = ''
        for i in xrange(8):
            d = random.randint(0,35)
            if d > 25:
                d = 48 + d-26
            else:
                d = 97+d
            secret += chr(d)
        self.r.hset('options:user:%s' % username, 'secret', secret)
        self.r.set('options:reverse-secret:%s' % secret, username)
        return secret
        
    def get_email(self, username):
        return self.r.hget('options:user:%s' % username, 'email')

    def set_email(self, username, email):
        self.r.hset('options:user:%s' % username, 'email', email)

    def create_user(self, username):
        created = self.r.sadd('users', username)
        secret = ''
        if created:
            secret = self.generate_secret(username)
            
        return created, secret
    
    def usernames_by_email(self, email):
        result = []
        for username in self.get_agents():
            if self.get_email(username) == email:
                secret = self.r.hget('options:user:%s' % username, 'secret')
                result.append((username, secret))
        return result

    def authenticate_user(self, user, secret):
        stored_secret = self.r.hget('options:user:%s' % user, 'secret')
        if not stored_secret:
            stored_secret = self.generate_secret(user)
            return True
        #if secret == '1':
            #return secret
        res = (len(secret)>0 and stored_secret == secret)
        return res
        
    def delete_user(self, username):
        print 'delete user options', self.r.delete('options:user:%s' % username)
        return self.r.srem('users', username)
        
    def user_exists(self, username):
        return self.r.sismember('users', username)
    
    def get_agents(self):
        return self.r.smembers('users')
    
    def query(self, q):
        return eval('self.query_%s' % self.dbtype)(q)
        
    def execute(self, q):
        return eval('self.execute_%s' % self.dbtype)(q)
        
    def get(self, q):
        res = eval('self.get_%s' % self.dbtype)(q)
        #print '****res (%s): %s' % (self.dbtype, res)
        return res
        
    # def get_context_description(self, context):
    #     return self.r.get('context:description:%s' % context)
    # def set_context_description(self, context, contextDescr):
    #     if contextDescr:
    #         self.r.setnx('context:description:%s' % context, contextDescr)

    def join_context(self, context, user):
        print 'joining context', context, user
        for key in self.r.smembers('%s:profile:keys' % user):
            if self.r.sadd(getKA(context, key), user):
                self.r.zincrby(getK(context), key, 1)
            for val in self.r.smembers('%s:profile:key:%s' % (user, key)):
                if self.r.sadd(getKVA(context, key, val), user):
                    self.r.zincrby(getKV(context, key), val, 1)
        self.r.sadd('contexts', context)
        self.r.sadd('context:%s' % context, user)
        
    def clear_context(self, context):
        for user in self.r.smembers('context:%s' % context):
            self.r.delete(getK(context))
            for key in self.r.smembers('%s:profile:keys' % user):
                self.r.delete(getKA(context, key))
                self.r.delete(getKV(context, key))
                for val in self.r.smembers('%s:profile:key:%s' % (user, key)):
                    self.r.delete(getKVA(context, key, val))
            
            self.r.srem('context:%s' % context, user)
        
    def leave_context(self, context, user):
        for key in self.r.smembers('%s:profile:keys' % user):
            if self.r.srem(getKA(context, key), user):
                score = self.r.zincrby(getK(context), key, -1)
                if score == 0:
                    self.r.zrem(getK(context), key)
            for val in self.r.smembers('%s:profile:key:%s' % (user, key)):
                if self.r.srem(getKVA(context, key, val), user):
                    score = self.r.zincrby(getKV(context, key), val, -1)
                    if score == 0:
                        self.r.zrem(getKV(context, key), val)

        self.r.srem('context:%s' % context, user)



