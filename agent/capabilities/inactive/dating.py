# -*- coding: utf-8 -*-
import tornado.escape

from capability import *
from datetime import datetime, timedelta

from api import cache

class dating(Cap):
    def __init__(self, usr, parameters, db, on_response):
        self.on_response = on_response
        self.parameters = parameters
        name = __name__.split('.')[-1]
        Cap.__init__(self, name, usr, db)
        
    def get(self):
        agent_url = self.parameters.get('agent_url')
        
        label = '%s%s' % (agent_url.split('/')[-1], self.name)
        label = str(label)
        values = cache.get(label) or {}
        
        res = dict(data=values)
        self.on_response(res)
        
    def post(self):
        params = self.parameters.get('params')
        product_url = params['product_url']
        price = params['price']
        direction = params['direction']
        
        satellite_url = tornado.escape.url_unescape(params['satellite_url'])
        agent_url = self.parameters.get('agent_url')
        
        res = dict(agent=agent_url, error='', satellite_url=satellite_url, product_url=product_url, price=price, direction=direction)
        self.update_satellite(res, satellite_url)
        
        label = '%s%s' % (agent_url.split('/')[-1], self.name)
        label = str(label)
        cache.set(label, res)
        
        return res
        