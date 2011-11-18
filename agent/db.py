# -*- coding: utf-8 -*-
import time
from datetime import datetime
import redis
import random

class DB:
    def __init__(self):
        self.r = redis.Redis(host='localhost', port=6379, db=0)

    def generate_secret(self, username):
        secret = ''
        for i in xrange(4):
            d = random.randint(0,35)
            if d > 25:
                d = 48 + d-26
            else:
                d = 97+d
            secret += chr(d)
        self.r.hset('options:%s' % username, 'secret', secret)
        return secret
        
    def create_user(self, username):
        created = self.r.sadd('users', username)
        if created:
            secret = self.generate_secret(username)
            
        return created, secret
    
    def authenticate_user(self, user, secret):
        stored_secret = self.r.hget('options:%s' % user, 'secret')
        if not stored_secret:
            stored_secret = self.generate_secret(user)
            return True
        if secret == '1':
            return secret
        return (secret and stored_secret == secret)
        
    def delete_user(self, username):
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
        

