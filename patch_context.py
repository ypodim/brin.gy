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



def reset_loc():
    toplid = int(r.get('global:nextlid'))
    for lid in xrange(1001, toplid+1):
        ldic = r.hgetall('location:lid:%s' % lid)
        r.delete('location:title:%s:lid' % ldic['title'])
        r.delete('location:lid:%s' % lid)

    r.delete('location:names')
    r.delete('global:nextlid')

def all_loc():
    toplid = int(r.get('global:nextlid'))
    for lid in xrange(1001, toplid+1):
        ldic = r.hgetall('location:lid:%s' % lid)
        print ldic, r.sismember('location:names', ldic['title'])

    print r.smembers('location:names')
    # r.set('location:title:%s:lid' % title, lid)

def add_location(ldic):
    # if title is successfully added to the set
    if not r.get('global:nextlid'):
        r.set('global:nextlid',1000)

    title = ldic.get('title')
    if not title:
        return None
    if r.sadd('location:names', title):
        lid = r.incr('global:nextlid')
        print r.hmset('location:lid:%s' % lid, ldic)
        r.set('location:title:%s:lid' % title, lid)
    else:
        lid = r.get('location:title:%s:lid' % title)
    return lid



def upgrade_values():
    for vid in xrange(1001, int(r.get('global:nextvid'))+1):

        ldic = r.hgetall('profile:vid:%s' % vid)
        print vid, ldic
        add_location(ldic)

def upgrade_context():
    for c in r.smembers('contexts'):
        if c == 'all':
            continue
        ldic = r.hgetall('context:%s:location' % c)
        print ldic
        if ldic:
            r.delete('context:%s:location' % c)

        eastgateid = 1003
        mlid = 1004

        if c == 'Eastgate':
            r.set('context:%s:lid' % c, eastgateid)
        if c == 'MIT Media Lab':
            r.set('context:%s:lid' % c, mlid)
        if c == 'Ignite Boston 9':
            r.set('context:%s:lid' % c, mlid)
        if c == 'MLabber Summer Plans':
            r.set('context:%s:lid' % c, mlid)


        if c == 'Coimbatore':
            ldic = dict(lat=11.0173876046, 
                        lon=76.9599151722, 
                        radius=9554.25783334, 
                        title=c)
            lid = add_location(ldic)
            r.set('context:%s:lid' % c, lid)
        if c == 'ROFLcon':
            ldic = dict(lat=42.3615489366, 
                        lon=-71.0905418333, 
                        radius=74.6426393229, 
                        title=c)
            lid = add_location(ldic)
            r.set('context:%s:lid' % c, lid)


upgrade_values()
# upgrade_context()

sys.exit()

vids = {}
for c in r.smembers('contexts'):
    if c == 'all':
        continue
    for k in r.zrevrangebyscore(getK(c), '+inf', '-inf'):
        for v in r.zrevrangebyscore(getKV(c, k), '+inf', '-inf'):
            vid = r.get('profile:composite:key:%s:val:%s' % (k,v))
            if vid:
                if vid not in vids:
                    vids[vid] =[]
                vids[vid].append((k,v))




for vid in vids:
    title = vids[vid][0][1]
    ldic = r.hgetall('profile:vid:%s' % vid)
    # print r.hset('location:lid:%s' % vid, 'title', vids[vid][0][1])

    if r.sadd('location:titles', title):
        lid = r.incr('global:nextlid')
        print r.hmset('location:lid:%s' % lid, ldic)
        r.set('location:title:%s:lid' % title, lid)


