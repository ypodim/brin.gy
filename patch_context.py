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

patch = {}
patch['Eastgate'] = [42.361806843086804, -71.08414926021453, 18.66065983073613]

patch['Ignite Boston 9'] = [42.36044625623657, -71.08733706562873, 37.32131966147226]
patch['MLabber Summer Plans'] = [42.36044625623657, -71.08733706562873, 37.32131966147226]
patch['MIT Media Lab'] = [42.36044625623657, -71.08733706562873, 37.32131966147226]

patch['Coimbatore'] = [11.017387604645862, 76.95991517216794, 9554.257833336898]
patch['ROFLcon'] = [42.3615489365627, -71.09054183331295, 74.64263932294452]

for c in r.smembers('contexts'):
    if c == 'all':
        continue

    print c
    print r.get('context:description:%s' % c)
    print r.hgetall('context:%s:location' % c)
    # print r.hgetll('context:%s:expiration' % c)
    print r.get('context:%s:cid' % c)

    # if c in patch:
    #     print patch[c]
    #     loc = dict(lat=patch[c][0], lon=patch[c][1], radius=patch[c][2])
    #     r.hmset('context:%s:location' % c, loc)
    
    





