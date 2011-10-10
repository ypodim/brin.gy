
import random
import json
import time
import sys

from copy import copy
from blist import sortedlist, sorteddict, sortedset
from bisect import bisect_left, bisect_right
from math import sqrt


'''
0. set location of an agent
1. find location of a given agent id
2. get list of agents in a given lat/lon range
'''


class Range0:
    def __init__(self, name):
        #eg. lat -> [agent1, agent2, ...]
        self.dic = sorteddict({})
        self.name = name
    def __len__(self):
        return len(self.dic.keys())
        
    def add(self, key, value, thres):
        
        try:
            self.dic[key].append( value )
            #print 'appended %s %s in %s. adding for the first time' % (key, value, self.dic)
        except KeyError:
            #print '%s not in %s. adding for the first time' % (key, self.dic)
            self.dic[key] = [value]
        
        matches = copy(self.dic[key])
        
        keys = self.dic.keys()
        max_pos = len(keys)
        cur_pos = keys.index(key)
        t_pos = cur_pos
        found_lower = found_upper = False
        if thres:
            while t_pos > 0 and key - keys[t_pos] < thres:
                matches += self.dic[keys[t_pos]]
                t_pos -= 1
            
        t_pos = cur_pos
        if thres:
            while t_pos < max_pos and keys[t_pos] - key < thres:
                matches += self.dic[keys[t_pos]]
                t_pos += 1
        
        return matches
        
    def remove(self, key, value):
        try:
            self.dic[key].remove(value)
        except:
            return "agent %s not found in %s or value %s not found" % (value, self.dic[key], key)
    
        if len(self.dic[key]) == 0:
            del self.dic[key]
        return ""
        
    def __getitem__(self, key):
        if type(key) != slice:
            return self.dic[key]
        
        posx = bisect_left( self.dic.keys(), key.start )
        posy = bisect_right( self.dic.keys(), key.stop )
        
        return self.dic.keys()[posx:posy]
        

class Range:
    def __init__(self, name):
        #eg. lat -> [agent1, agent2, ...]
        self.dic = sorteddict({})
        self.name = name
    def __len__(self):
        return len(self.dic.keys())
        
    def cleanup(self, timeout):
        now = time.time()
        for k,v in self.dic.items():
            for agent, tstamp in v.items():
                if now - tstamp > timeout:
                    print 'eliminating', k, agent
                    del self.dic[k][agent]
                    
            if len(self.dic[k]) == 0:
                del self.dic[k]
        
    def add(self, key, value, thres):
        now = time.time()
        try:
            self.dic[key][value] = now
        except KeyError:
            self.dic[key] = {}
            self.dic[key][value] = now
        
        matches = self.dic[key].keys()
        
        keys = self.dic.keys()
        max_pos = len(keys)
        cur_pos = keys.index(key)
        t_pos = cur_pos
        found_lower = found_upper = False
        if thres:
            while t_pos > 0 and key - keys[t_pos] < thres:
                matches += self.dic[keys[t_pos]].keys()
                t_pos -= 1
            
        t_pos = cur_pos
        if thres:
            while t_pos < max_pos and keys[t_pos] - key < thres:
                matches += self.dic[keys[t_pos]].keys()
                t_pos += 1
        
        return matches
        
    def remove(self, key, value):
        try:
            del self.dic[key][value]
        except:
            return "agent %s not found or key %s not found" % (value, key)
    
        if len(self.dic[key]) == 0:
            del self.dic[key]
        return ""
        
    def __getitem__(self, key):
        if type(key) != slice:
            return self.dic[key]
        
        posx = bisect_left( self.dic.keys(), key.start )
        posy = bisect_right( self.dic.keys(), key.stop )
        
        return self.dic.keys()[posx:posy]
        

class Location:
    agents = {}
    lat = Range('lat')
    lon = Range('lon') 
    #lat.remove(latval, aid)
    #lat[latval] = aid
    #lat[latval] -> aid1, aid2, ...
    
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
        count = 0
        matches = {}
        if val:
            query = json.loads(val)
            lat = query['lat']
            lon = query['lon']
            thres = query['threshold']
            
            for x in self.lat[lat-thres:lat+thres]:
                for agent in self.lat.dic[x]:
                    if agent not in matches:
                        matches[agent] = 0
                    matches[agent] += 1
            
            for x in self.lon[lon-thres:lon+thres]:
                for agent in self.lon.dic[x]:
                    if agent not in matches:
                        matches[agent] = 0
                    matches[agent] += 1
                    
            for agent, v in matches.items():
                if v < 2:
                    del matches[agent]
            count = len(matches)
        else:
            matches = dict(self.lat.dic)
            count = len(matches)
            
        result = dict(error='', count=count, matches=matches)
        return result
        
    def get(self, lat=None, lon=None, thres=None):
        if not lat or not lon:
            return dict(agents=self.agents, lat=dict(self.lat.dic), lon=dict(self.lon.dic))
        
        lat_matches = self.lat[lat-thres:lat+thres]
        lon_matches = self.lon[lon-thres:lon+thres]
        
        #print lat_matches
        #print lon_matches
        
        return dict(agents=self.agents, lat=self.lat, lon=self.lon)
        
        

class Range2:
    def __init__(self):
        #eg. property -> [dic1, dic2, ...]
        #    each dic: value -> [agent1, agent2, ...]
        self.dic = sorteddict({})
    def __len__(self):
        return len(self.dic.keys())
    
    def cleanup(self, timeout):
        now = time.time()
        for key, dic in self.dic.items():
            for val, agents in dic.items():
                for agent, tstamp in agents.items():
                    if now - tstamp > timeout:
                        print 'eliminating', key, val, agent
                        del self.dic[key][val][agent]
                if len(agents) == 0:
                    del self.dic[key][val]
            if len(dic) == 0:
                del self.dic[key]
                        
    def add(self, key, val, aid):
        now = time.time()
        
        if key not in self.dic:
            self.dic[key] = sorteddict({})
            
        if val not in self.dic[key]:
            self.dic[key][val] = {}
        
        self.dic[key][val][aid] = now
        return self.dic[key][val]
        
    def remove(self, key, val, aid):
        try:
            del self.dic[key][val][aid]
        except:
            return "something is not there: %s -> %s -> %s" % (key, val, aid)
            
        if len(self.dic[key][val]) == 0:
            del self.dic[key][val]
        if len(self.dic[key]) == 0:
            del self.dic[key]
            
        return ""
        
    def get(self, key, val=None):
        res = []
        
        if val:
            lookfor = val.lower()
            iterthrough = self.dic.get(key, {})
        else:
            lookfor = key.lower()
            iterthrough = self.dic
            
        for v in iterthrough:
            if v.lower().startswith(lookfor):
                res.append(v)
                
        return res
        
        
class Profile:
    agents = {}
    props = Range2()
    count = {}
    count_tstamp = 0
    
    def get_count(self, key='', val=''):
        result = dict(error='', count=0, matches=[])
        if key:
            if key in self.props.dic:
                if val:
                    result['matches'] = self.props.dic[key].get(val, [])
                    result['count'] = len(result['matches'])
                else:
                    if key not in self.count:
                        self.count[key] = dict(tstamp=0, count=0)
                        
                    if time.time() - self.count[key]['tstamp'] > 1:
                        #print 'getting fresh count for', key
                        self.count[key]['count'] = 0
                        for val, agents in self.props.dic[key].items():
                            self.count[key]['count'] += len(agents)
                            result['matches'] += agents
                            
                        self.count[key]['tstamp'] = time.time()

                    result['count'] = self.count[key]['count']
            else:
                result['error'] = 'key %s not found' % key
        else:
            if time.time() - self.count_tstamp > 2:
                self.count = {}
                for key, details in self.props.dic.items():
                    self.get_count(key)
                
                self.count_tstamp = time.time()
            
            dic = {}
            total = 0
            for key, details in self.count.items():
                dic[key] = details['count']
                total += details['count']
                
            result['matches'] = dic
            result['count'] = total
            
        return result
    
    def get(self, params, arguments):
        #print params[0], arguments
        error = ''
        matches = {}
        count = 0
        key = val = ''
        if len(params) == 0:
            matches = dict(keys=list(self.props.dic.keys()))
            
        if len(params) >= 1:
            if params[0] == 'complete':
                if len(params) >= 2:
                    key = params[1]
                    if len(params) >= 3:
                        val = params[2]
                matches = dict(matches=self.props.get(key))
                
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
                bucket = 10
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


class Buysell:
    #buy/sell
        #productid
            #price
                #agents
    
    action = Range('action')
    product = Range('product')
    price = Range('price')
    
    #agents = {}
    #props = {
        #"on sale": Range(),
        #"on request": Range(),
    #}
    
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
        matches = {}
        #print 'get_count', key, val
        result = dict(error='', count=0, matches=[])
        if key in ['action', 'product', 'price']:
            dic = eval('self.%s.dic'%key)
            if val:
                matches = dic.get(val, {})
            else:
                for val,agents in dic.items():
                    for a in agents:
                        matches[a] = 1
        else:
            try:
                query = json.loads(val)
            except:
                error = 'bad val, expected json: %s' % val
                query = {}
                
            action = query.get('action')
            product = query.get('product')
            price = query.get('price')
            
            target_dimensions = 0
            if action: target_dimensions += 1
            if product: target_dimensions += 1
            if price: target_dimensions += 1
            
            for agent in self.action.dic.get(action, []):
                if agent not in matches:
                    matches[agent] = 0
                matches[agent] += 1
            
            for agent in self.product.dic.get(product, []):
                if agent not in matches:
                    matches[agent] = 0
                matches[agent] += 1
                
            for agent in self.price.dic.get(price, []):
                if agent not in matches:
                    matches[agent] = 0
                matches[agent] += 1
            
            for agent, v in matches.items():
                if v < target_dimensions:
                    del matches[agent]
        
        unique_matches = {}
        for m in matches:
            unique_matches[m.split('_')[0]] = 1
        matches = unique_matches.keys()
        
        count = len(matches)
        #print count, matches
        return dict(error=error, count=count, matches=unique_matches)
        
    
    def get(self, params, arguments):
        if params == ['']: params = []
        
        error = ''
        matches = {}
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
                bucket = 10
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
        





