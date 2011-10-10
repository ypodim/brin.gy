# -*- coding: utf-8 -*-
from capability import *
from api import debug



class friends(Cap):
    def __init__(self, usr, parameters, db, on_response):
        self.on_response = on_response
        self.parameters = parameters
        name = __name__.split('.')[-1]
        Cap.__init__(self, name, usr, db)
        self.params = self.parameters.get('params')
        self.AGENT_URL = ''
        
    def get_accessible_items(self, requester):
        dic = []
        
        #for line in Data.objects.filter(cap__name=self.name, access__who='default'):
            #dic.append((line.key, line.val))
        #for line in Data.objects.filter(cap__name=self.name, access__who=requester):
        objects = Data.objects.filter(models.Q(cap__name=self.name), 
                                      models.Q(access__who=requester)|
                                      models.Q(access__who='default'))
        for line in objects:
            dic.append((line.key, line.val))
        
        return dic
        
        
    def show_everything(self):
        res = {'everything':[]}
        for req in self.load(''):
            res['everything'].append('%s:%s' % (req.key, req.val))
        return res


    def get(self):
        
        method             = self.parameters.get('method')
        request_url        = self.parameters.get('request_url')
        requester          = self.parameters.get('requester')
        params             = self.parameters.get('params')
        authenticated_user = self.parameters.get('authenticated_user')
        requested_user     = self.parameters.get('requested_user')
        
        self.AGENT_URL = '%s/%s' % ('WHATWHAT', authenticated_user)
        
        if request_url:
            request_url = request_url[0]
    
        #if request_url == 'show_everything':
            #return self.show_everything()
            
        if request_url in ['requests', 'stalkers', 'providers'] and requester == 'myself':
            res = {request_url:[]}
            for req in self.load(request_url):
                res[request_url].append(req.val)
        else:
            res = {'error':'', 'res':'nothing to see here'}
        
        self.on_response(res)
        
        
    def post(self):
        valid_requests = ['request', 'send_request', 'accept', 'reject', 'delete', 'confirmation']
        if request_url in valid_requests:
            result, error = eval('self.handle_request_%s' % request_url)(requester, params)
            return {'res':result, 'error':error}
            
        return {'error':'Invalid URL or HTTP method: %s %s %s' % (method, request_url, requester)}
        
            
            
    def handle_request_request(self, requester, params):
        """
        Agent to Agent
        This is a friend request from "requester"
        """
        debug('got friend request from %s' % requester)
        self.save('requests', requester)
        auto_accept = False
        if auto_accept:
            self.handle_request_accept('myself', {'from':requester})
        return 'we will see...', ''
            
    
    def handle_request_confirmation(self, requester, params):
        """
        Agent to Agent
        This confirms acceptance of previous friend request
        """
        #print 'confirmation from %s' % requester
        debug('sending confirmation of acceptance back to %s' % requester)
        self.delete('requests', requester)
        self.save('providers', requester)
        return 'ok, thanks', ''
            
                
    def handle_request_send_request(self, requester, params):
        """
        User to Agent
        This sends a friend request to a remote agent
        """
        if requester!='myself':
            return '', 'Unauthorized request from %s' % requester
            
        request_to = params.get('to')
        debug('sending friend request to %s' % request_to)
        if not request_to:
            return '', 'Did not specify who to send the request to ("to" argument)'
        
        # SEND REQUEST !!!!!!!!!!!!!!!!!!!!!!!!
        params = {'requester':self.AGENT_URL}
        ticket = self.send_data('%s/friends/request' % request_to, params=params, expiration='never')

        #self.save('friend', request_to)
        result = '<a href=/show_ticket/%s>ticket %s</a>' % (ticket, ticket)
        return result, ''
                
                
    def handle_request_accept(self, requester, params):
        """
        User to Agent
        This instructs agent to accept a pending friend request
        """
        debug('accepting friend request from %s' % params.get('from'))
        if requester!='myself':
            return '', 'Unauthorized request from %s' % requester
            
        app_name = params.get('app_name', 'stalkers')
        request_from = params.get('from')
        if not request_from:
            return '', 'Did not specify which request to accept ("from" argument)'
            
        req = self.load('requests', val=request_from)
        
        if not req:
            return '', 'No request found from %s' % request_from
        
        # SEND ACCEPT CONFIRMATION !!!!!!!!!!!!!!!
        sent = False
        params = {'requester':self.AGENT_URL}
        ticket = self.send_data('%s/friends/confirmation' % request_from, params=params, expiration=600)
        sent = True
        if not sent:
            return '', 'Could not send confirmation to %s' % request_from
        
        result = '<a href=/show_ticket/%s>ticket %s</a>' % (ticket, ticket)
        self.save(app_name, request_from)
            
        for r in req:
            r.delete()
                
        return result, ''
        
        
    def handle_request_reject(self, requester, params):
        """
        User to Agent
        This instructs agent to reject a pending friend request
        """
        if requester!='myself':
            return '', 'Unauthorized request from %s' % requester
            
        request_from = params.get('from')
        if not request_from:
            return '', 'Did not specify which request to reject ("from" argument)'
            
        req = self.load('requests', val=request_from)
        if not req:
            return '', 'No request found from %s' % request_from
            
        for r in req:
            r.delete()
            
        return 'ok rejected', ''
            
            
    def handle_request_delete(self, requester, params):
        """
        User to Agent
        This instructs agent to delete (remove) an existing friend entry
        """
        if requester!='myself':
            return '', 'Unauthorized request from %s' % requester
            
        flag = False #whether I deleted anything
        
        stalker_to_delete = params.get('stalker')
        if stalker_to_delete:
            req = self.load('stalkers', val=stalker_to_delete)
            if not req:
                return '', 'No stalker found under %s' % stalker_to_delete
            
            for r in req: r.delete()
            flag = True
            
        provider_to_delete = params.get('provider')
        if provider_to_delete:
            req = self.load('providers', val=provider_to_delete)
            if not req:
                return '', 'No provider found under %s' % provider_to_delete
            
            for r in req: r.delete()
            flag = True
            
        
        return '', 'deleted something: %s stalker:%s provider:%s' % (flag, stalker_to_delete, provider_to_delete)
        
        
                    
        
