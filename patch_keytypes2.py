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

r.set('global:nextvid', 1000)
# print r.incr('global:nextkid')


for c in []:#r.smembers('contexts'):
    print
    print c
    for k in r.zrange('profile:%s:keys' % c, 0, -1):
        # work with specific keys
        if k in ['physical location']:
            # set its type
            r.set('profile:key:%s:type' % k, 'location')

            for v,score in vals(k, c=c):

                vid = r.get('profile:composite:key:%s:val:%s' % (k, v))
                print vid, k, v
                # if this vid (kv pair) has not been used before
                if not vid:
                    if v == 'Arlington MA':
                        print 'using', c
                        vid = r.incr('global:nextvid')
                        dic = dict(lat=42.41856071305931, 
                                   lon=-71.1670300746826, 
                                   title=v, 
                                   radius=20480)

                    if v == 'Cambridge MA':
                        vid = r.incr('global:nextvid')
                        dic = dict(lat=37.9946631488178, 
                                   lon=-122.40467808984374, 
                                   title=v, 
                                   radius=20480)

                    # if vid is not set yet, just exit (not Cambridge, nor Arlington)
                    if not vid:
                        continue

                    # create the vid entry
                    r.hmset('profile:vid:%s' % vid, dic)

                    # set the pointer from a complex kv pair to the vid that represents it
                    r.set('profile:composite:key:%s:val:%s' % (k, v), vid)

# print 'BEFORE'
# k = 'physical location'
# nextvid = int(r.get('global:nextvid'))
# print 'nextvid', nextvid
# for vid in xrange(1000,nextvid+1):
#     print vid, r.hgetall('profile:vid:%s' % vid)

# print '=======BEFORE'

# for c in r.smembers('contexts'):
#     for k in r.zrange('profile:%s:keys' % c, 0, -1):
#         r.delete('profile:key:%s:type' % k)
#         if k in ['physical location']:
#             for v,score in vals(k, c=c):
#                 print k, v, c
#                 vid = r.get('profile:composite:key:%s:val:%s' % (k, v))
#                 print r.delete('profile:composite:key:%s:val:%s' % (k, v))
#                 print r.delete('profile:vid:%s' % vid)

# print 'AFTER'
# k = 'physical location'
# nextvid = int(r.get('global:nextvid'))
# print 'nextvid', nextvid
# for vid in xrange(1000,nextvid+1):
#     print vid, r.hgetall('profile:vid:%s' % vid)



def getvid(k,v):
    return r.get('profile:composite:key:%s:val:%s' % (k, v))

def annotate(c, k, v, ktype, dic):
    r.sadd('profile:keytypes', 'string', 'location', 'time', 'user')
    r.set('profile:key:%s:type' % k, ktype)

    vid = getvid(k,v) or r.incr('global:nextvid')

    r.hmset('profile:vid:%s' % vid, dic)
    r.set('profile:composite:key:%s:val:%s' % (k, v), vid)

def deannotate(c, k, v):
    # r.sadd('profile:keytypes', 'string', 'location', 'time', 'user')
    # r.set('profile:key:%s:type' % k, ktype)

    vid = getvid(k,v)
    if vid:
        r.delete('profile:vid:%s' % vid)
        r.delete('profile:composite:key:%s:val:%s' % (k, v), vid) 

def getfullkv(c,k,v):
    vid = getvid(k,v)
    dic = r.hgetall('profile:vid:%s' % vid)
    dic['ktype'] = r.get('profile:key:%s:type' % k)
    return dic




c = 'MLabber Summer Plans'
k = 'physical location'
ktype = 'location'

v = 'Arlington MA'
dic = dict(lat=42.41856071305931, 
           lon=-71.1670300746826, 
           title=v, 
           radius=20480)
annotate(c, k, v, ktype, dic)
# deannotate(c, k, v)

v = 'Cambridge MA'
dic = dict(lat=37.9946631488178, 
           lon=-122.40467808984374, 
           title=v, 
           radius=20480)
annotate(c, k, v, ktype, dic)
# deannotate(c, k, v)

print getfullkv(c,k,v)

# print getfullkv(c,k,v)






