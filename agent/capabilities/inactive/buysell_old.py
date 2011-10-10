# -*- coding: utf-8 -*-
from capability import *
from datetime import datetime, timedelta
from api import cache, cron

import tornado.escape
import time, json

class buysell(Cap):
    def __init__(self, usr, parameters, db, on_response):
        self.on_response = on_response
        self.parameters = parameters
        name = __name__.split('.')[-1]
        Cap.__init__(self, name, usr, db)
    
    def get_job_name(self, index, itemid):
        agent_url = self.parameters.get('agent_url')
        name = '%s_%s_%s_%s' % (agent_url, self.name, index, itemid)
        return name
        
    def get(self):
        agent_url = self.parameters.get('agent_url')
        
        label = '%s_%s_%s' % (agent_url.split('/')[-1], self.name, 'buysell')
        label = str(label)
        values = cache.get(label) or {}
        
        for k in values:
            values[k]['matched'] = []
            values[k]['lumped'] = []
            
            if time.time() - int(values[k]['tstamp']) < int(values[k]['timeout']):
                name = self.get_job_name( values[k]['index'], values[k]['itemid'] )
                
                content = cron.get_responses(name)
                dic = json.loads(content)
                
                agents = dic.get('agents', {})
                agentdic = agents.get(agent_url, {})
                query = agentdic.get('query', {})
                matched = query.get('matched', {})
                lumped = query.get('lumped', {})
                stats = dic.get('statistics', {})
                
                values[k]['matched'] = matched
                values[k]['lumped'] = lumped
        
        res = dict(data=values)
        self.on_response(res)
    
    def delete(self):
        agent_url = self.parameters.get('agent_url')
        params = self.parameters.get('params')
        index = params.get('index')
        itemid = params.get('itemid')
        
        label = '%s_%s_%s' % (agent_url.split('/')[-1], self.name, 'buysell')
        label = str(label)
        values = cache.get(label) or {}
        for k,v in values.items():
            key = '%s%s' % (index, itemid)
            if k == key:
                del values[k]
                cache.set(label, values)
                
                name = self.get_job_name(index, itemid)
                print cron.stop_job(name)
                
        res = dict(error='')
        return res
        
    def post(self):
        params = self.parameters.get('params')
        satellite_url = params.get('satellite_url','http://localhost:22222')
        action = params.get('action')
        index = params.get('index')
        itemid = params.get('itemid')
        price = params.get('price')
        threshold = params.get('threshold', '0')
        threshold = int(threshold)
        timeout = params.get('timeout', '0')
        timeout = int(timeout)
        
        satellite_url = tornado.escape.url_unescape(satellite_url)
        agent_url = self.parameters.get('agent_url')
        
        
        query = dict(cap='buysell', price_threshold=threshold)
        query = json.dumps(query)
        
        request_url = 'http://localhost:22222/buysell'
        name = self.get_job_name(index, itemid)
        data = dict(agent=agent_url, 
                    error='', 
                    satellite_url=satellite_url, 
                    index=index, 
                    itemid=itemid, 
                    price=price, 
                    action=action, 
                    threshold=threshold,
                    timeout=timeout,
                    tstamp=time.time(),
                    query=query,
                   )
        
        res = cron.start_job(name, request_url, data, timeout)
        
        label = '%s_%s_%s' % (agent_url.split('/')[-1], self.name, 'buysell')
        label = str(label)
        
        values = cache.get(label) or {}
        key = '%s%s' % (index, itemid)
        values[key] = data
        cache.set(label, values)
        
        return data
        