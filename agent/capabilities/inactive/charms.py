# -*- coding: utf-8 -*-

from capability import *
from api import cache, DEFAULT_PROJECT_PICTURE_URL, DEFAULT_USER_PICTURE_URL, debug

from datetime import datetime
import time

try: import simplejson as json
except ImportError: import json

import tornado.httpclient

datetime_mask = "%Y-%m-%d %H:%M:%S"

class charms(Cap):
    def __init__(self, usr, parameters, db, finish):
        self.finish = finish
        self.parameters = parameters
        name = __name__.split('.')[-1]
        Cap.__init__(self, name, usr, db)
        self.result_dic = {'charms':[], 'error':'', 'more_info':{}}
        
        self.params = self.parameters.get('params')
        
        
    def post(self):
        print 'CHARMS POST', self.params
        
        cid = self.params.get('id')
        typ = self.params.get('type')
        sta = self.params.get('state','')
        pic = self.params.get('picture','')
        loc = self.params.get('location','')
        res = {'res':{'id':cid, 'type':typ, 'picture':pic, 'state':sta}, 'debug':'', 'error':''}
        
        if not cid or not typ:
            res['error'] = 'DID NOT FIND cid, typ', cid, typ
            print '*** Insert charm: %s' % res['error']
            return res
        
        key = json.dumps({'id':cid, 'type':typ})
        chrms = self.load(key=key)

        now = datetime.now()
        now = now.strftime(datetime_mask)
        
        if not pic:
            if typ == 'person':
                pic = DEFAULT_USER_PICTURE_URL
            else:
                pic = DEFAULT_PROJECT_PICTURE_URL
        
        if chrms:
            for c in chrms:
                key = json.loads(c['key'])
                val = json.loads(c['val'])
                
                dic = json.loads(val)
                if sta:
                    dic['state'] = sta
                    dic['picture'] = pic
                    dic['location'] = ''
                    dic['last_modified'] = now
                    res['debug'] += '%s: modified state to %s\n' % (cid, sta)
                    
                val = json.dumps(dic)
                self.save(key, val)
        else:
            val = json.dumps({'location':loc, 'state':sta, 'picture':pic, 'last_modified':now})
            res['debug'] += 'saved new charm %s\n' % cid
            self.save(key, val)
        
        return res

    def delete(self):
        
        print 'CHARMS DELETE', self.params
        
        cid = self.params.get('id')
        typ = self.params.get('type')
        
        res = error = ''
        
        if not cid or not typ:
            print 'DID NOT FIND cid, typ', cid, typ
            error = 'id and/or type params not provided'
        else:
            key = json.dumps({'id':cid, 'type':typ})
            res = self.remove(key, None)

        return {'res':res, 'error':error}
        
    def get_(self):
        charms = []
        for c in self.load():

            key = json.loads(c['key'])
            val = json.loads(c['val'])
            
            dic = dict(id       = key['id'], 
                       type     = key['type'], 
                       picture  = val['picture'], 
                       state    = val['state'], 
                       location = val['location'])
            
            charms.append(dic)
        
        dic = {'charms':charms}
        self.finish(dic)
        
        
    def get(self):
        
        mif = self.params.get('more_info',False)
        charms = []
        for c in self.load():

            key = json.loads(c['key'])
            val = json.loads(c['val'])
            
            client_location = self.params.get('locationid','not provided')
            
            local = (val['location'] and val['location'].lower() == client_location.lower())

            dic = {'id':key['id'], 'type':key['type'], 'picture':val['picture'], 'state':val['state'], 'local_to_client':local, 'location':val['location'], 'timestamp':time.mktime(c.tstamp.timetuple())}
            
            if mif:
                cache_key = str('project-%s' % key['id'])
                cached_dic = cache.get(cache_key)
                if cached_dic:
                    self.process_response(cached_dic)
                else:
                    url = 'http://tagnet.media.mit.edu/get_project_info?projectid=%s' % key['id']
                    debug('REQUEST PROJECT %s' % key['id'])
                    http = tornado.httpclient.AsyncHTTPClient()
                    http.fetch(url, callback=self.response_clb)

            charms.append(dic)
        
        #charms = sorted(charms, key=lambda k: k['local_to_client'], reverse=True)
        self.result_dic['data'] = charms
        
        remaining = self.asyncs_finished()
        
        if not mif or not charms or not remaining:
            self.finish(self.result_dic)
            
    
    def asyncs_finished(self):
        asyncs_retrieved = len(self.result_dic['more_info'])
        asyncs_executed = len(self.result_dic['charms'])
        
        #print sorted([x['id'] for x in self.result_dic['more_info'].values()])
        #print sorted([x['id'] for x in self.result_dic['charms']])
        
        return asyncs_executed - asyncs_retrieved
        
    def response_clb(self, response):
        
        if response.error:
            raise tornado.web.HTTPError(500)
            
        dic = tornado.escape.json_decode(response.body)
        self.process_response(dic)
        
        cache_key = str('project-%s' % dic['id'])
        day = 24 * 3600
        cache.set(cache_key, dic, day)

        print 'saved', cache.get(cache_key), len(dic)
        
    def process_response(self, dic):
        self.result_dic['more_info'][dic['id']] = dic
        
        remaining = self.asyncs_finished()
        
        if not remaining:
            self.finish(self.result_dic)



        