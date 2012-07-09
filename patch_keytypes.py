# -*- coding: utf-8 -*-
import redis
import time
import sys
import random
import unittest
import httplib2
import urllib
import json

from keys import *
import profile

h = httplib2.Http()

def post(dic, path='', method='POST', url='http://localhost:10007'):
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    body = urllib.urlencode(dic)
    uri = '%s%s'%(url,path)
    resp, content = h.request(uri, method, headers=headers, body=body)
    return json.loads(content)


r = redis.Redis(host='localhost', port=6379, db=0)
#r.flushall()

# for c in r.smembers('contexts'):
#     for u in r.smembers('context:%s' % c):
#         print r.sadd('context:users:%s' % c, u), c, u

def users():
    return r.smembers('users')
def ukeys(username):
    return r.smembers('%s:profile:keys' % username)
def uvals(username, key):
    return r.smembers('%s:profile:key:%s' % (username,key))


def keys(c='all'):
    return r.zrevrangebyscore('profile:%s:keys' % c, '+inf', '-inf')
def vals(key, c='all'):
    return r.zrevrangebyscore('profile:%s:key:%s:values' % (c, key), '+inf', '-inf', withscores=True)
def revkey(key, c='all'):
    return r.smembers('profile:%s:key:%s:agents' % (c, key))
def revkeyval(key, val, c='all'):
    return r.smembers('profile:%s:key:%s:val:%s:agents' % (c, key, val))


print r.delete('profile:keytypes')
print r.sadd('profile:keytypes', 'string', 'location', 'time', 'user')
print r.smembers('profile:keytypes')

r.set('global:nextvid', 1000)
# print r.incr('global:nextkid')

for c in r.smembers('contexts'):
    print c
    for k in r.zrange('profile:%s:keys' % c, 0, -1):
        r.delete('profile:key:%s:type' % k, 'string')

        if k in ['physical location']:
            r.set('profile:key:%s:type' % k, 'location')
            for v,score in vals(k, c=c):
                if v == 'Cambridge MA':

                    vid = r.incr('global:nextvid')
                    dic = dict(lat=37.9946631488178, 
                               lon=-122.40467808984374, 
                               title=v, 
                               radius=20480)
                    r.hset('profile:key:%s:vid:%s' % (k, vid), dic)


                    # create new value entry with vid as value
                    r.zadd('profile:%s:key:%s:values' % (c, k), vid, score)


                    for u in r.smembers('profile:%s:key:%s:val:%s:agents' % (c, k, v)):
                        # add reverse pointers to users for the new vid value
                        r.sadd('profile:%s:key:%s:val:%s:agents' % (c, k, vid), u)
                        # add k,vid to each user
                        r.sadd('%s:profile:key:%s' % (u,k), vid)
        

        # r.hset('profile:key:%s:type' % k, 

