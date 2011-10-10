# -*- coding: utf-8 -*-

from datetime import datetime, timedelta

from capability import *
from api import debug

class events(Cap):
    def __init__(self, usr, parameters, db, on_response):
        self.on_response = on_response
        self.parameters = parameters
        name = __name__.split('.')[-1]
        Cap.__init__(self, name, usr, db)
        
        self.required_params = {}
        self.required_params['detected']      = ['readerid', 'rfid', 'usersLoggedIn']

        self.required_params['login']         = ['login_user', \
                                                'current_node_id', \
                                                'current_node_type', \
                                                'nearby_users', \
                                                'logged_in_users'\
                                                ]
        self.required_params['logout']         = ['logout_user', \
                                                'current_node_id', \
                                                'current_node_type', \
                                                'nearby_users', \
                                                'logged_in_users'\
                                                ]                                                                                         
        
        # self.required_params['receive_charm'] = ['projectid', 'receivedfrom']
        # self.required_params['give_charm']    = ['projectid', 'givento']
        
        self.required_params['portfolio']     = ['ip']

        self.required_params['collage']       = ['screenid', 'screen_position']
        
        self.required_params['back']          = ['current_node_id', \
                                                 'current_node_type', \
                                                 'previous_node_id', \
                                                 'previous_node_type', \
                                                 'nearby_users', \
                                                 'logged_in_users'\
                                                 ]
        
        self.required_params['forward']       = ['current_node_id', \
                                                 'current_node_type', \
                                                 'next_node_id', \
                                                 'next_node_type', \
                                                 'timeout', \
                                                 'nearby_users', \
                                                 'logged_in_users'\
                                                 ]
        
        self.required_params['charm']         = ['charming_user_id', \
                                                 'charmed_node_id', \
                                                 'charmed_node_type', \
                                                 'nearby_users', \
                                                 'logged_in_users'\
                                                 ]
        
        self.required_params['uncharm']       = ['uncharming_user_id', \
                                                 'uncharmed_node_id', \
                                                 'uncharmed_node_type', \
                                                 'nearby_users', \
                                                 'logged_in_users'\
                                                  ]
                                                  
        self.required_params['demo']          = ['demo_node_id', \
                                                 'demo_node_type', \
                                                 'nearby_users', \
                                                 'logged_in_users'\
                                                  ]
        
        
        
    def get(self):
        
        request_url        = self.parameters.get('request_url')
        params             = self.parameters.get('params')
        
        action = ''
        if len(request_url) > 0: action = request_url[0]
        
        if not params:

            dic = {'events':[], 'error':''}
            for e in self.load():
                event  = e.key
                params = e.val
                tstamp = '%s' % e.tstamp
                
                try:
                    eparams = self.parse_event(event, params)
                except (AttributeError, KeyError):
                    debug( 'event %s not valid' % event )
                    continue
                except ValueError:
                    debug( '%s: %s could not be broken down to necessary values' % (event,params) )
                    continue
                    
                eparams['eventType'] = event
                eparams['tstamp'] = tstamp
                dic['events'].append(eparams)
                
            dic['events'] = sorted(dic['events'], key=lambda k: k['tstamp'], reverse=1)[:1000]
                
            self.on_response(dic)
            return
            
        
        eventType = params.get('eventType')
        
        if eventType and eventType in self.required_params.keys():
            result, error = self.receive_event( eventType, params )
        else:
            result = ''
            error = 'invalid eventType %s' % eventType
            
        dic = {'res':result, 'error':error}
        self.on_response(dic)


    def parse_event(self, eventType, params):
        """
        parse event and return its attributes
        """
        return dict(zip(self.required_params[eventType],params.split('$')))
        
        
    def receive_event(self, eventType, params):
        """
        receive event and save it
        """
        
        res = error = ''
        val_params = []
        for param in self.required_params[eventType]:
            if param in params:
                val_params.append( params[param] )
            else:
                error = 'missing parameter %s for eventType %s' % (param, eventType)
                
        if not error:
            val = '$'.join(['%s'%x for x in val_params])
        
            debug('%s EVENT: %s: %s' % (datetime.now(), eventType, val))
            
            res = '%s' % self.save(key=eventType, val=val, tstamp=datetime.now())

        return res, error
        
       
        
    
        
        
        
        
        
        
        
        
        
        
        