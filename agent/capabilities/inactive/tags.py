# -*- coding: utf-8 -*-
from capability import *
from datetime import datetime
from api import debug, cache


class tags(Cap):
    def __init__(self, usr, parameters, db, on_response):
        self.on_response = on_response
        self.parameters = parameters
        name = __name__.split('.')[-1]
        Cap.__init__(self, name, usr, db)
        self.params = self.parameters.get('params')
        
        
    def get(self):

        method             = self.parameters.get('method')
        request_url        = self.parameters.get('request_url')
        requester          = self.parameters.get('requester')
        params             = self.parameters.get('params')
        authenticated_user = self.parameters.get('authenticated_user')
        requested_user     = self.parameters.get('requested_user')
        
        dataform = ''
        if request_url:
            dataform = request_url[0]
    
        res = {'res':[]}

        if self.user == 'ML':
            from ego2.models import *
            res['res'] = [x['val'] for x in Data.objects.filter(cap__name='tags').values('val').distinct()]
        else:
            res['res'] = [x.val for x in self.load('tag')]

        self.on_response(res)

    def post(self):
        if 'new_tag' in params:
            new_tag = params['new_tag']
            self.save('tag', new_tag)
            return {'res':''}

        if 'del_tag' in params:
            del_tag = params['del_tag']
            
            tags = self.load('tag', del_tag)
            for t in tags:
                t.key = 'tag_inactive'
                t.save()
                deleted = True

            #deleted = self.delete('tag', del_tag)
            return {'res':deleted}
            
        return {'error':'Invalid URL or HTTP method: %s %s %s' % (method, request_url, requester)}
            

