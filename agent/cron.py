#!/usr/bin/python
# -*- coding: utf-8 -*-

#import random
import json, urllib, httplib2
import time
from threading import Thread

class Job(Thread):
    def __init__ (self, name, request_url, data, exec_clb, finish_clb, exec_timeout=1, ttl=10):
        Thread.__init__(self)
        self.name = name
        self.finish_clb = finish_clb
        self.exec_clb = exec_clb
        self.data = data
        self.exec_timeout = exec_timeout
        self.ttl = ttl
        self.start_time = time.time()
        self.response_time = 0
        self.request_url = request_url
        self.go = 1
    
    def __str__(self):
        return self.name
    def __unicode__(self):
        return self.name
    
    def set_data(self, data):
        self.data = data
        
    def execjob(self):
        
        h = httplib2.Http()
        body = urllib.urlencode(self.data)
        try:
            resp, content = h.request(self.request_url, method="POST", body=body)
        except Exception, e:
            print '*** %s' % e
            content = '{"error":"%s"}' % e
        
        self.exec_clb(self.name, content)
        
    def run(self):
        last_exec = 0
        while self.go:
            now = time.time()
            if now - last_exec > self.exec_timeout:
                self.execjob()
                last_exec = time.time()
            time.sleep(0.5)
            
            if now - self.start_time > self.ttl:
                self.go = 0
                
        self.finish_clb(self.name)


class Cron:
    jobs = {}
    responses = {}
    
    def job_finished(self, name):
        del self.jobs[name]
        print 'job %s ended' % name
    
    def job_executed(self, name, content):
        #print
        #print '@ job %s got back: %s' % (name, content)
        self.responses[name] = content
    
    def get_responses(self, name):
        return self.responses.get(name, '{}')
        
    def start_job(self, name, request_url, data, ttl=30):
        if name in self.jobs:
            error = dict(error='job with name %s already exists' % name)
            return error
            
        job = Job(name, request_url, data, self.job_executed, self.job_finished, ttl=ttl)
        job.start()
        self.jobs[name] = job
        print '@@@ JOB started:', name
        return dict(job=name)

    def stop_job(self, name):
        if name in self.jobs:
            self.jobs[name].go = 0
            return dict(msg='job %s will be terminated' % name)
        else:
            return dict(error='job with name %s does not exist' % name)
        
    def get_jobs(self):
        return self.jobs.keys()

    