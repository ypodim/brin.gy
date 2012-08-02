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

def safe_remove_location(lid):
    ldic = r.hgetall('location:lid:%s' % lid)
    title = ldic.get('title')
    
    r.srem('location:names', title)
    r.delete('location:lid:%s' % lid)
    r.set('location:title:%s:lid' % title, lid)

def get_kv_by_vid(vid):
    res = []
    for c in r.smembers('contexts'):
        if c == 'all':
            continue
        for k in r.zrevrangebyscore(getK(c), '+inf', '-inf'):
            for v in r.zrevrangebyscore(getKV(c, k), '+inf', '-inf'):
                try:
                    vids = r.smembers('profile:composite:key:%s:val:%s' % (k,v))
                except:
                    print 'bad type', c,k,v, r.get('profile:composite:key:%s:val:%s' % (k,v))
                    r.delete('profile:composite:key:%s:val:%s' % (k,v))
                # if vidtest == 'None':
                #     print 'skatoules', c,k,v
                #     continue
                for vidtest in vids:
                    if vidtest and int(vid) == int(vidtest):
                        res.append( (k,v) )

    return res


def upgrade_values():
    for vid in xrange(1001, int(r.get('global:nextvid'))+1):

        ldic = r.hgetall('profile:vid:%s' % vid)
        kv = get_kv_by_vid(vid)
        if kv:
            # print vid, ldic
            title = kv[1]
            # print r.sismember('location:names', title), title, ldic
            ldic['title'] = title
            lid = add_location(ldic)
            r.set('profile:composite:key:%s:val:%s' % (kv[0],kv[1]), lid)

def upgrade_context():
    for c in r.smembers('contexts'):
        if c == 'all':
            continue

        print c

        ldic = r.hgetall('context:%s:location' % c)
        print ldic
        if ldic:
            r.delete('context:%s:location' % c)

        eastgateid = 1003
        mlid = 1004


        medialab = dict(lat=42.3604457757343, 
                        lon=-71.08734495781516, 
                        radius=37.32131966147226, 
                        title='MIT Media Lab')
        csail = dict(lat=42.3615489366, 
                        lon=-71.0905418333, 
                        radius=74.6426393229, 
                        title='CSAIL')
        coimbatore = dict(lat=11.0173876046, 
                        lon=76.9599151722, 
                        radius=9554.25783334, 
                        title='Coimbatore')
        eastgate = dict(lat=42.36187077420754, 
                        lon=-71.0840029253826, 
                        radius=37.32131966147226, 
                        title='Eastgate')

        if c == 'Coimbatore':
            lid = add_location(coimbatore)
            r.set('context:%s:lid' % c, lid)

        if c == 'ROFLcon':
            lid = add_location(csail)
            r.set('context:%s:lid' % c, lid)

        if c == 'Eastgate':
            lid = add_location(eastgate)
            r.set('context:%s:lid' % c, lid)

        if c == 'MIT Media Lab':
            lid = add_location(medialab)
            r.set('context:%s:lid' % c, lid)

        if c == 'Ignite Boston 9':
            lid = add_location(medialab)
            r.set('context:%s:lid' % c, lid)

        if c == 'MLabber Summer Plans':
            lid = add_location(medialab)
            r.set('context:%s:lid' % c, lid)

def upgrade_loc_titles():
    for name in r.smembers('location:names'):
        r.delete('location:title:%s:lid' % name)
    r.delete('location:names')

    for title in r.smembers('location:titles'):
        r.delete('location:title:%s:lid' % title)
    r.delete('location:titles')

    for latlonstring in r.smembers('location:latlonstrings'):
        r.delete('location:latlonstring:%s:lid' % latlonstring)
    r.delete('location:latlonstrings')

    toplid = int(r.get('global:nextlid'))
    for lid in xrange(1001, toplid+1):
        ldic = r.hgetall('location:lid:%s' % lid)
        
        r.set('location:title:%s:lid' % ldic['title'], lid)
        r.sadd('location:titles', ldic['title'])

        latlonstr = '%s %s' % (ldic['lat'], ldic['lon'])
        r.set('location:latlonstring:%s:lid' % latlonstr, lid)
        r.sadd('location:latlonstrings', latlonstr)

        print lid, \
            ldic.get('title'), \
            get_kv_by_vid(lid), \
            r.sismember('location:names', ldic.get('title')), \
            r.sismember('location:titles', ldic.get('title')), \
            r.get('location:title:%s:lid' % ldic.get('title'))

    
def verify_loc_keyvalues():
    for c in r.smembers('contexts'):
        for k in r.zrevrangebyscore(getK(c), '+inf', '-inf'):
            ktype = r.get('profile:key:%s:type' % k)
            if ktype != 'location':
                continue
            
            for v in r.zrevrangebyscore(getKV(c, k), '+inf', '-inf'):
                lid = r.get('profile:composite:key:%s:val:%s' % (k,v))
                ldic = r.hgetall('location:lid:%s' % lid)
                if not ldic:
                    agents = r.smembers('profile:%s:key:%s:val:%s:agents' % (c,k,v))
                    print c, k, ktype, v, lid, agents

                    # take action
                    r.delete('profile:%s:key:%s:val:%s:agents' % (c,k,v))
                    print r.scard('profile:%s:key:%s:val:%s:agents' % (c,k,v))
                    r.zrem('profile:%s:key:%s:values' % (c,k), v)
                    print (v in r.zrevrangebyscore(getKV(c, k), '+inf', '-inf'))
                    for u in agents:
                        r.srem('%s:profile:key:%s' % (u,k), v)
                        print r.sismember('%s:profile:key:%s' % (u,k), v)

def reset_creator():
    toplid = int(r.get('global:nextlid'))
    for lid in xrange(1001, toplid+1):
        ldic = r.hgetall('location:lid:%s' % lid)
        r.hset('location:lid:%s' % lid, 'creator', 'ypodim')
        print ldic

def convert_kvcomposite_to_list():
    for c in r.smembers('contexts'):
        for k in r.zrevrangebyscore(getK(c), '+inf', '-inf'):
            for v in r.zrevrangebyscore(getKV(c, k), '+inf', '-inf'):
                try:
                    lidtest = r.get('profile:composite:key:%s:val:%s' % (k,v))
                except:
                    continue
                if lidtest:
                    print 'converting', k,v, lidtest
                    print r.delete('profile:composite:key:%s:val:%s' % (k,v))
                    r.sadd('profile:composite:key:%s:val:%s' % (k,v), lidtest)


# convert_kvcomposite_to_list()
# sys.exit()

# reset_creator()

# verify_loc_keyvalues()

lastlid = r.get('global:nextlid')
# lastlid = 1023
print lastlid
ldic = r.hgetall('location:lid:%s' % lastlid)
print ldic
print get_kv_by_vid(lastlid)

lat = ldic['lat']
lon = ldic['lon']
title = ldic['title']
latlonstr = '%s %s' % (lat, lon)
print r.sismember('location:latlonstrings', latlonstr)
print r.sismember('location:titles', title)
print r.sismember('location:title:%s' % title, lastlid)
print r.get('location:latlonstring:%s:lid' % latlonstr)




# print r.delete('location:lid:%s' % lastlid)
# print r.set('global:nextlid', int(lastlid)-1)


# print r.smembers('location:titles')
# print r.smembers('location:names')
# upgrade_loc_titles()


# upgrade_values()
# upgrade_context()
# all_loc()
# print safe_remove_location(1026)

