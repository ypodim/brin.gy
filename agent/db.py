# -*- coding: utf-8 -*-
import time
from datetime import datetime
import redis

class DB:
    def __init__(self):
        self.r = redis.Redis(host='localhost', port=6379, db=0)

    def create_user(self, username):
        return self.r.sadd('users', username)
        
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
        

