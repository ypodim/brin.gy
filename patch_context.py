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


# print r.delete('profile:keytypes')
# print r.sadd('profile:keytypes', 'string', 'location', 'time', 'user')
# print r.smembers('profile:keytypes')




# print r.get('global:nextcid')
# sys.exit()





for c in r.smembers('contexts'):
    if c == 'all':
        r.set('context:%s:cid' % c, 1000)
        r.set('context:cid:%s' % 1000, c)

    print
    
    cid = getcid(r, c)
    if not cid or cid == 'None':
        cid = r.incr('global:nextcid')
        print 'got cid', cid
        r.set('context:%s:cid' % c, cid)
        r.set('context:cid:%s' % cid, c)
        
    print c, cid
    continue





