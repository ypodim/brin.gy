# -*- coding: utf-8 -*-

import random
import json
import time
import sys

from copy import copy
from math import sqrt

from keys import *

class location:
    agents = {}
    def __init__(self, r):
        self.r = r
    def mutate(self, aid, lat, lon, thres=0):
        if aid not in self.agents:
            self.lat.add(lat, aid, thres)
            self.lon.add(lon, aid, thres)
            self.agents[aid] = (lat, lon, time.time())
            return []
        
        oldlat, oldlon, tstamp = self.agents[aid]
        
        self.lat.remove(oldlat, aid)
        latmatches = {}
        
        for match in self.lat.add(lat, aid, thres):
            latmatches[match] = 1
        
        self.lon.remove(oldlon, aid)
        matches = []
        for match in self.lon.add(lon, aid, thres):
            #print match,
            if match in latmatches:
                lon_test = self.agents[match][1]
                lat_test = self.agents[match][0]
                if sqrt(pow((lat-lat_test),2)+pow((lon-lon_test),2)) < thres:
                    #print 'GOT', match
                    matches.append(match)
        #print
        self.agents[aid] = (lat, lon, time.time())
        
        return matches

    def get_count(self, key='', val=''):
        #print 'location get_count', key, val
        count = 0
        matches = []
        if not val:
            #for bucket in self.r.smembers('location:%s:buckets' % key):
                #for agent in self.r.smembers('location:%s:latlon:%s' % (key, bucket)):
                    #matches.append(agent)
            
            matches = self.r.smembers('location:%s:allusers' % key) or []
            count = len(matches)
            matches = list(matches)
            
            return dict(error='', count=count, matches=matches)
        
        query = json.loads(val)
        
        if not query['lat'] or not query['lon']:
            return dict(error='', count=count, matches=matches)
            
        lat = float(query['lat'])
        lon = float(query['lon'])
        thres = float(query.get('threshold',0.0001))
        
        resolution = 100000
        latbucket = 1.0 * int(lat * resolution) / resolution
        lonbucket = 1.0 * int(lon * resolution) / resolution
        
        fromlatbucket = 1.0 * int((lat-thres) * resolution) / resolution
        tolatbucket   = 1.0 * int((lat+thres) * resolution) / resolution
        
        fromlonbucket = 1.0 * int((lon-thres) * resolution) / resolution
        tolonbucket   = 1.0 * int((lon+thres) * resolution) / resolution
        
        #print lat, latbucket, lon, lonbucket, thres
        #print fromlatbucket, latbucket, tolatbucket, lat-thres, lat, lat+thres
        #print fromlonbucket, lonbucket, tolonbucket, lon-thres, lon, lon+thres
        
        latb = fromlatbucket
        while latb <= tolatbucket:
            lonb = fromlonbucket
            while lonb <= tolonbucket:
                
                bucket = '%s %s' % (latb, lonb)
                contents = self.r.smembers('location:%s:latlon:%s' % (key, bucket))
                #print bucket, len(contents), '     ',
                for aid in contents:
                    #matches[aid] = 1
                    matches.append(aid)
                lonb += 1.0/resolution
            
            #print
            latb += 1.0/resolution

        count = len(matches)
        return dict(error='', count=count, matches=matches)
            
        
    def get(self, params, arguments):
        #print 'satellite location get'
        
        error = ''
        matches = []
        count = 0
        lat = lon = ''
        
        if len(params) >= 1:
            if params[0] == 'fetch':
                if len(params) > 2:
                    aid = params[1]
                    key = params[2]
                    
                    lat = self.r.get('%s:location:%s:lat' % (aid,key)) or ''
                    lon = self.r.get('%s:location:%s:lon' % (aid,key)) or ''
                    
                    if lat and lon:
                        val = json.dumps(dict(lat=lat, lon=lon))
                        dic = self.get_count(key, val)
                        count = dic['count']
                        matches = dic['matches']
            
        return dict(matches=matches, error=error, count=count, lat=lat, lon=lon)

        
class profile:
    agents = {}
    count = {}
    count_tstamp = 0
    def __init__(self, r):
        self.r = r
    
    def get_count(self, context, key, val='', cardinalities_only=False):        
        #print 'key', key, 'val', val
        result = dict(error='', count=0, matches=[])
        
        if val:
            result['count'] = self.r.zscore(getKV(context, key), val)
            if not cardinalities_only:
                result['matches'] = list(self.r.smembers(getKVA(context, key, val)))
        else:
            result['count'] = self.r.zscore(getK(context), key)
            if not cardinalities_only:
                result['matches'] = list(self.r.smembers(getKA(context, key)))
                
        return result
    
    def get(self, params, arguments):
        params = [x for x in params if x]
        print 'satellite profile get', params, arguments
        #arguments = json.loads(arguments or '{}')
        
        error = ''
        items = []
        count = 0
        key = val = ''

        bucket = 100
        start_from = arguments.get('start_from')
        aid = arguments.get('user')
        if type(start_from) == list: start_from = start_from[0]
        if type(aid) == list: aid = aid[0]
        
        if len(params) < 2:
            return dict(items=items, error='invalid/insufficient parameters', count=count)
            
        context = str(params[0])
        kparam = params[1]
        print 'context', context
        print 'kparam', kparam
        
        #print params
        
        if kparam == 'keys':
            start = self.r.zrevrank(getK(context), start_from) or 0
            keyscores = self.r.zrevrangebyscore(getK(context), '+inf', '-inf', withscores=True, num=bucket, start=start)
            items = keyscores
            
        elif kparam == 'keyvals':
            start = self.r.zrevrank(getK(context), start_from) or 0
            keyscores = self.r.zrevrangebyscore(getK(context), '+inf', '-inf', withscores=True, num=bucket, start=start)
            for key, kscore in keyscores:
                item = dict(key=key, values=[], score=kscore)
                #start = self.r.zrevrank(self.getKV(key), start_from) or 0
                for val, vscore in self.r.zrevrangebyscore(getKV(context, key), '+inf', '-inf', withscores=True):
                    userhasit = int(self.r.sismember(getKVA(context, key, val), aid))
                    #print key, val, aid, userhasit
                    vitem = dict(val=val, userhasit=userhasit, score=vscore)
                    item['values'].append(vitem)
                items.append(item)
                
        elif kparam == 'key' and len(params) > 3:
            key = params[2]
            if params[3] == 'agents':
                items = list(self.r.smembers(getKA(context, key)))
                
            elif params[3] == 'values':
                start = self.r.zrevrank(getKV(context, key), start_from) or 0
                items = self.r.zrevrangebyscore(getKV(context, key), '+inf', '-inf', withscores=True, num=bucket, start=start)
                
            elif params[3] == 'val' and len(params) > 5 and params[5] == 'agents':
                val = params[4]
                items = list(self.r.smembers(getKVA(context, key, val)))
                
            else:
                error='invalid/insufficient parameters'
        else:
            error='invalid/insufficient parameters'
            
        return dict(items=items, error=error, count=count, start_from=start_from)
            
    
    def mutate(self, aid, key, val):
        if aid not in self.agents:
            print 'adding new', aid, key, val
            self.props.add(key, val, aid)
            self.agents[aid] = time.time()
            return []
        
        # Let's try removing this triplet first and if that fails
        # we'll try adding it.
        #print 'removing', aid, key, val
        result = self.props.remove(key, val, aid)
        
        matches = []
        if result: # an error was returned, so the triplet does not exist
            #print 'adding', aid, key, val
            matches = self.props.add(key, val, aid)
        #else:
            #print 'removed', aid, key, val
            
        self.agents[aid] = time.time()
        
        return matches
        
    def set(self, aid, key, val):
        matches = self.props.add(key, val, aid)
        self.agents[aid] = time.time()
        
        return matches


class buysell:
    #buy/sell
        #productid
            #price
                #agents
    
    #action = Range('action')
    #product = Range('product')
    #price = Range('price')
    
    #agents = {}
    #props = {
        #"on sale": Range(),
        #"on request": Range(),
    #}
    def __init__(self, r):
        self.r = r
    def get_count(self, key='', val=''):
        # key can be one of action, product, price, or empty
        # if key is provided, val must be a matching value
        # if key is not provided, val must be a dic that contains
        # one or more of action, product, price matching values
        
        # key='', val={'action':'sell', 'product':'ipad', 'price':234}
        # key='action', val='', all agents engaging in some action
        # key='product', val='ipad', all agents where an ipad is involved
        
        error=''
        count = 0
        matches = []
        
        if val:
            dic = json.loads(val)
            product = dic['product']
            action = dic['action']
            matches = self.r.smembers('buysell:product:%s:action:%s' % (product, action))
            matches = list(matches)
            count = len(matches)
            
        #print 'buysell get_count', key, val, type(val)
        
        if key in ['product']:
            matches = []
            count = self.r.scard('buysell:product')
        
        return dict(error=error, count=count, matches=matches)
        
    
    def get(self, params, arguments):
        if params == ['']: params = []
        
        error = ''
        matches = []
        count = 0
        key = val = ''
        if len(params) == 0:
            matches = dict(action=dict(self.action.dic),
                           product=dict(self.product.dic),
                           price=dict(self.price.dic))
            
        if len(params) >= 1:
            if params[0] == 'complete':
                error = 'IMPLEMENT ME'
                matches = {}
                
            if params[0] == 'match':
                if len(params) >= 2:
                    key = params[1]
                    if len(params) >= 3:
                        val = params[2]
                
                dic = self.get_count(key, val)
                count = dic['count']
                matches = dic['matches']
                
            if params[0] == 'multimatch':
                res = []
                arguments = json.loads(arguments)
                for key, val in arguments:
                    dic = self.get_count(key, val)
                    res.append([key, val, dic['count'], dic['matches']])
                    
                #print res
                matches = res
                
            if params[0] == 'fetch':
                bucket = 100
                start_from = ''
                if len(params) >= 2 and params[1]:
                    start_from = params[1]
                    try:
                        index = self.props.dic.keys().index(start_from) + 1
                        matches = list(self.props.dic.keys()[index:index+bucket])
                    except ValueError:
                        error = 'key %s not found' % start_from
                        matches = list(self.props.dic.keys()[:bucket])
                else:
                    matches = list(self.props.dic.keys()[:bucket])
            
        return dict(matches=matches, error=error, count=count)
            
    
    def mutate(self, action, product, price, aid):
        key = product
        val = int(price)
        
        agent_hash = '%s_%s_%s_%s' % (aid, action, product, price)
        print 'satellite to mutate', action, key, val, agent_hash
        
        #if aid not in self.agents:
            #print 'adding new', aid, key, val
            #self.props.add(key, val, aid)
            #self.agents[aid] = time.time()
            #return []
        
        # Let's try removing this tuple first and if that fails
        # we'll try adding it.
        #print 'removing', aid, key, val
        result = {}
        matches = []
        
        if action in self.action.dic and agent_hash in self.action.dic[action] and \
           product in self.product.dic and agent_hash in self.product.dic[product] and \
           price in self.price.dic and agent_hash in self.price.dic[price]:
            
            self.action.remove(action, agent_hash)
            self.product.remove(product, agent_hash)
            self.price.remove(price, agent_hash)
        else:
            self.action.add(action, agent_hash, 0)
            self.product.add(product, agent_hash, 0)
            self.price.add(price, agent_hash, 0)
            
        return matches
        





