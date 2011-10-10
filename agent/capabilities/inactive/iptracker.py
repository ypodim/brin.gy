# -*- coding: utf-8 -*-
from capability import *
from datetime import datetime
from api import debug, cache


class iptracker(Cap):
    def __init__(self, usr, parameters, db, on_response):
        self.on_response = on_response
        self.parameters = parameters
        name = __name__.split('.')[-1]
        Cap.__init__(self, name, usr, db)
        self.params = self.parameters.get('params')
        
    def handle_request(self, parameters):
        
        res = {'error':'', 'res':''}
        
        if 'all' in self.params:
            res['res'] = ['%s'%x for x in self.load()]
        
        if 'set' in self.params and self.params['set']:
            setname = self.params['set']
            ip = self.parameters['headers']['HTTP_X_REAL_IP']
            
            existing_entries = self.load(key=setname)
            if existing_entries:
                e = existing_entries[0]
                e.val = ip
                e.tstamp = datetime.now()
                e.save()
                result = 'updated %s,%s' % (setname,ip)
            else:
                self.save(setname, ip)
                result = 'inserted %s,%s' % (setname,ip)
                
            res['res'] = result
        
        if 'get' in self.params and self.params['get']:
            getname = self.params['get']
            ip = self.load(key=getname)
            if ip:
                res['res'] = {'host':getname, 'ip':'%s' % ip[0].val, 'tstamp':'%s' % ip[0].tstamp}
            else:
                res['res'] = ''
                res['error'] = 'Host %s not found' % getname
            
        if 'clear' in self.params:
            self.load().delete()
            
        return res
        

        
    def get(self):
        agent_url = self.parameters.get('agent_url')
        
        label = '%s_%s_%s' % (agent_url.split('/')[-1], self.name, 'iptracker')
        label = str(label)
        values = cache.get(label) or {}
        
        res = dict(data=values)
        self.on_response(res)
    
        
    def post(self):
        params = self.parameters.get('params')
        satellite_url = params.get('satellite_url','http://localhost:22222')
        action = params.get('action')
        index = params.get('index')
        itemid = params.get('itemid')
        price = params.get('price')
        threshold = params.get('threshold')
        
        satellite_url = tornado.escape.url_unescape(satellite_url)
        agent_url = self.parameters.get('agent_url')
        
        res = dict(agent=agent_url, error='', satellite_url=satellite_url, index=index, itemid=itemid, price=price, action=action, threshold=threshold)
        self.update_satellite(res, satellite_url)
        
        label = '%s_%s_%s' % (agent_url.split('/')[-1], self.name, 'buysell')
        label = str(label)
        
        values = cache.get(label) or {}
        key = '%s%s' % (index, itemid)
        values[key] = res
        cache.set(label, values)
        
        return res