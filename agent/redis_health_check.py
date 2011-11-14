# -*- coding: utf-8 -*-
import redis
import time
import sys
import random
import unittest
import httplib2
import urllib
import json

h = httplib2.Http()

def post(dic, path='', method='POST', url='http://localhost:10007'):
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    body = urllib.urlencode(dic)
    uri = '%s%s'%(url,path)
    resp, content = h.request(uri, method, headers=headers, body=body)
    return json.loads(content)


if __name__ == '__main__':
    r = redis.Redis(host='localhost', port=6379, db=0)
    
    resolution = 100000
    key = 'my location'
    print 'checking redundant location bucket entries'
    for b in r.smembers('location:%s:buckets' % (key)):
        lat, lon = b.split()
        for aid in r.smembers('location:%s:latlon:%s' % (key, b)):
            lat = float(lat)
            lon = float(lon)
            
            lattest = r.get('%s:location:%s:lat' % (aid, key))
            lontest = r.get('%s:location:%s:lon' % (aid, key))
            if lattest and lontest:
                lattest = float(lattest)
                lontest = float(lontest)
                lattest = 1.0*int(lattest * resolution)/resolution
                lontest = 1.0*int(lontest * resolution)/resolution
            
            if not (lat==lattest and lon==lontest):
                print '*** redundant location bucket entry: bucket: %s  aid: %s' % (b, aid)
                print aid, lat, lon
                #print 'removed', r.srem('location:%s:latlon:%s' % (key, b), aid)
    print 'done.'
    print
    
    print 'checking for orphaned profile key entries'
    users = r.smembers('users') 
    for u in users:
        for k in r.smembers('%s:profile:keys' % (u)):
            l = len(r.smembers('%s:profile:key:%s' % (u,k)))
            if (l == 0):
                print '*** problem with user:%s no values for key:%s' % (u, k)
                r.srem('%s:profile:keys' % u, k)
                print 'deleted.'
                
                print 'user:%s in reverse for key:%s: %s' % (u, k, (u in r.smembers('profile:key:%s' % k)))
                
                s = r.zrangebyscore('profile:keyscores', '-inf','+inf')
                print 'key in keyscores:%s' % (k in s)
                s = r.zrangebyscore('profile:keyvalscores:%s' % k, '-inf','+inf')
                print 'key in keyvalscores:%s' % (k in s)
                
                
    print 'done.'
    print
    
    
    for u in users:
        for key in r.smembers('%s:location:keys' % u):
            if key == 'my location':
                continue
            print 'trying invalid keys in location'
            for aid in r.smembers('location:%s:allusers' % key):
                print aid
                print 'deleted lat entry', r.delete('%s:location:%s:lat' % (aid, key))
                print 'deleted lon entry', r.delete('%s:location:%s:lon' % (aid, key))
            for b in r.smembers('location:%s:buckets' % key):
                print 'deleting invalid bucket entry:%s' % b, r.srem('location:%s:buckets' % key, b)
            for u in r.smembers('location:%s:allusers' % key):
                print 'deleting invalid allusers entry:%s' % b, r.srem('location:%s:allusers' % key, u)
        
    print 'done.'
    print
    
    
    
    
    
    
    
    
    