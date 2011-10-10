# -*- coding: utf-8 -*-

from capability import *
from api import debug

import os
from datetime import datetime

import tornado.escape


class calendar(Cap):
    def __init__(self, usr, parameters, db, on_response):
        self.on_response = on_response
        self.parameters = parameters
        name = __name__.split('.')[-1]
        Cap.__init__(self, name, usr, db)     
        self.params = self.parameters.get('params')

    def post(self):
        key = val = res = ''
        tstamp = datetime.now()
        
        kaka = self.params.get('kaka')
        mira = self.params.get('mira')
        d = self.params.get('d')
        m = self.params.get('m')
        y = self.params.get('y')
        if d and m and y:
            month = int(m)
            day   = int(d)
            year  = int(y)
            hour  = tstamp.hour
            minute= tstamp.minute
            sec   = tstamp.second
            tstamp = datetime(year, month, day, hour, minute, sec)
        print 'tstamp is', tstamp
        if kaka and tstamp: 
            key = 'kaka'
            val = '1'
            res = self.save(key, val, tstamp=tstamp)
        if mira and tstamp:
            key = 'mira'
            val = tornado.escape.url_unescape(mira)
            res = self.save(key, val, tstamp=tstamp)
            
        
        
        btn = self.params.get('btn')
        if btn == 'kaka':
            res = 'kaka'
            key = 'kaka'
            val = '1'
        if btn == 'halfm':
            res = '1/2 miralax'
            key = 'mira'
            val = '1/2'
        if btn == 'quarter':
            res = '1/4 miralax'
            key = 'mira'
            val = '1/4'
        if btn and key and val:
            print 'saving', btn, key, val
            self.save(key, val)
        
        return {'res':res}
        
    def delete(self):
        res = tstamp = ''
        key = self.params.get('key')
        val = self.params.get('val')
        tstamp = self.params.get('tstamp')
        
        if key and val and tstamp:
            val = tornado.escape.url_unescape(val)
            tstamp = tornado.escape.url_unescape(tstamp)
            res = self.remove(key, val, tstamp=tstamp)
            
        return {'res':res}
        
    def get(self):
        
        res = {'error':'', 'res':[]}

        month = self.params.get('month', '%s'%datetime.now().month)
        month = int(month)
        year = self.params.get('year', '%s'%datetime.now().year)
        year = int(year)
        
        for e in self.load():
            if e['tstamp'].month == month and e['tstamp'].year == year:
                dic = {'what':e['key'], 'quant':e['val']}
                dic['day'] = e['tstamp'].day
                dic['month'] = e['tstamp'].month
                dic['year'] = e['tstamp'].year
                dic['hour'] = e['tstamp'].hour
                dic['minute'] = e['tstamp'].minute
                dic['second'] = e['tstamp'].second
                res['res'].append( dic )
                
            #res['res'] = sorted(res['res'], key=lambda entry: entry['when'])
        
        self.on_response(res)
        
        


            

