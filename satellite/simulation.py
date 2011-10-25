#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import random
import math
import os
import pygame
from pygame.locals import *

import socket
import time
from struct import pack
import select
from threading import Thread
import json
import httplib2
import urllib

from simulation_configurations import *

DEFAULT_MODE = 0
LOCATION_MODE = 1
BUYSELL_MODE = 2
INTERSECTION_MODE = 3
MONITOR_MODE = 5


def load_png(name):
    """ Load image and return image object"""
    fullname = os.path.join('', name)
    print fullname
    #try:
    image = pygame.image.load(fullname)
    #if image.get_alpha is None:
        #image = image.convert()
    #else:
        #image = image.convert_alpha()
    #except pygame.error, message:
        #print 'Cannot load image:', fullname
        #raise SystemExit, message
    return image
    
    
class Point:
    def __init__(self, x=300, y=500):
        self.x = x
        self.y = y
    def noise(self, n=1):
        self.x += random.random() - 0.5
        self.y += random.random() - 0.5
        self.x = max(self.x, 0)
        self.y = max(self.y, 0)
        return self
    def distance(self, p):
        dx = p.x - self.x
        dy = p.y - self.y
        return math.sqrt(dx*dx + dy*dy)
    def randomize_in_rect(self, x, y, w, h):
        self.x = random.randrange(x, x+w)
        self.y = random.randrange(y, y+h)
    def copy(self):
        return Point(self.x, self.y)


class Ball():
    def __init__(self, id):
        self.name = 'agent%s' % id
        self.rect = pygame.Rect(0,0,10,10)
        screen = pygame.display.get_surface()
        self.area = screen.get_rect()
        self.hit = 0
        
        self.id = id
        self.p = Point()
        self.group = None
        self.col = (125,125,125)
        #self.start_waypoint = None
        self.end_waypoint = None
        self.segment_origin = None
        self.segment_statime = None
        self.last_move = time.time()
        self.size = 2 # 1 byte
        self.speed = random.randrange(10,30)
        self.mode = 0
        self.type = 0
        
        self.mon = {}
        self.threshold = 0
        
        self.profile = {}
        if random.random() > 0.2:
            self.profile['name'] = random.choice(['pol','grace','matt','julia','eyal','dawei','travis'])
        if random.random() > 0.2:
            self.profile['age'] = '%s' % random.randint(23,35)
            
        if random.random() > 0.2:
            self.profile['language'] = 'english'
            if random.random() > 0.2:
                self.profile['language'] = 'chinese'
            
        self.buysell = {'product':'iPad 32GB', 'action':'buy', 'price':random.randint(200,400)}
        
    def update(self):
        if self.group and self.group.name != 'pucks':
            self.p.noise()
            self.group.move(self)
        
    def color(self):
        if self.get_mode(MONITOR_MODE):
            return Color(51, 255, 204)
            
        if self.get_mode(LOCATION_MODE) and self.get_mode(BUYSELL_MODE):
            return Color(20,0,200)
            
        if self.get_mode(LOCATION_MODE):
            return Color(255,0,0)
            
        if self.get_mode(BUYSELL_MODE):
            return Color(51,102,0)
        
        return self.col
            
    def set_mode(self, mode):
        self.mode |= 2**mode
    def unset_mode(self, mode):
        self.mode &= (~(2**mode))
    def get_mode(self, mode):
        return ( self.mode & (2**mode) > 0)
        
    def draw(self, surface, screen_width, lat_height):
        pygame.draw.circle(surface, self.col, (int(self.p.x), int(self.p.y)), self.size)
        if self.mon.get('location'):
            threshold = screen_width * self.threshold / lat_height
            #print self.id, 'will be circled'
            pygame.draw.circle(surface, (255,10,10), (int(self.p.x), int(self.p.y)), int(threshold) or 5, 1)
        

class Waypoint(Point):
    def __init__(self, id, point):
        self.id = id
        self.next = {} # {wp1:prob1, wp2:prob2, ...}
        self.x = point.x
        self.y = point.y

class Group:
    def __init__(self, name, x=0, y=0, w=150, h=150):
        self.name = name
        self.p = Point(x, y)
        self.w = w
        self.h = h
        self.starting_point = None
        self.waypoints = {}
        
    def reposition_inside(self, p):
        p.x = max(p.x, self.p.x)
        p.x = min(p.x, self.p.x+self.w)
        p.y = max(p.y, self.p.y)
        p.y = min(p.y, self.p.y+self.h)
        
    def get_next(self, wp):
        wpid = random.choice(wp.next.keys())
        return self.waypoints[wpid]
        
    def move_on_path(self, obj):
        
        if not obj.end_waypoint:
            obj.end_waypoint = self.get_next(self.starting_point)
            
        now = time.time()
        destination = obj.end_waypoint
        if not obj.segment_origin:
            obj.segment_origin = obj.p.copy()
            obj.segment_statime = now
        
        seg_distance = obj.segment_origin.distance( destination )
        
        T  = seg_distance / obj.speed
        dt = now - obj.segment_statime
        dx = destination.x * dt / T + obj.segment_origin.x * (T - dt) / T
        dy = destination.y * dt / T + obj.segment_origin.y * (T - dt) / T
        
        obj.p.x = dx
        obj.p.y = dy
        
        new_distance = obj.p.distance( destination )
        traveled_distance = obj.segment_origin.distance( obj.p )
        if (traveled_distance > seg_distance):
            #print '***WE LOST POINT', obj.id
            
            #obj.start_waypoint = obj.end_waypoint
            obj.end_waypoint = self.get_next(obj.end_waypoint)
            
            obj.segment_origin = obj.p.copy()
            obj.segment_statime = now
            
        elif (new_distance < 5):
            
            #obj.start_waypoint = obj.end_waypoint
            obj.end_waypoint = self.get_next(obj.end_waypoint)
            
            obj.segment_origin = obj.p.copy()
            obj.segment_statime = now
            
        obj.last_move = now
  
    def move(self, obj):
        #if self.path:
        if self.starting_point:
            self.move_on_path(obj)
        else:
            self.reposition_inside(obj.p)


class Scenario(Thread):
    def __init__(self, width, height, n=1000):
        Thread.__init__(self)
        self.width = width
        self.height = height
        self.lat_start =  42.361
        self.lon_start = -71.084
        self.lat_height =  0.001
        self.lon_width =   0.0012
        
        self.n = n
        self.obj = []
        
        self.h = httplib2.Http()
        self.go = 1
        self.last_post = dict(location=0, profile=0, buysell=0)
        self.last_get = 0
        
        #self.bld_side = bld_side
        self.configuration = configuration1
        
        self.groups = []
        
        bucket_ceiling = 0
        self.agents_url = 'http://localhost:10007'
        
        self.sound = {}
        for i in xrange(1,9):
            a = pygame.mixer.Sound('beep%s.aiff' % i)
            self.sound[i] = a
            #self.sound[i].play()
            #time.sleep(1)
        
        
        #fake matix setup of groups
        #self.configuration['groups'] = []
        #for x in xrange(10):
            #for y in xrange(10):
                #g = dict(name='', x=x*50+50, y=y*50+50, n=10, w=50, h=50)
                #self.configuration['groups'].append(g)
        
        i = 0
        for group in self.configuration['groups']:
            w = group['w']
            h = group['h']
            
            print group['name'], w, h
            
            g = Group(group['name'], x=group['x'], y=group['y'], w=w, h=h)
            self.groups.append(g)
            
            for entry in group.get('waypoints', []):
                wp = Waypoint(entry['id'], Point(entry['x'], entry['y']))
                g.waypoints[entry['id']] = wp
                    
                if not g.starting_point:
                    g.starting_point = wp
                
                for n in entry['next']:
                    wp.next[n] = 1 # you should set probabilities here!!!!
            
            bucket_ceiling += group['n']
            while i < self.n and i < bucket_ceiling:
                x = random.randint(0, self.width)
                y = random.randint(0, self.height)
                #speed = 0.01 * random.randint(5, 100)
                
                o = Ball(i)
                o.group = g
                if g.name == 'Google':
                    o.profile['company'] = 'Google'
                    
                if g.name == 'E14':
                    if random.random() > 0.3:
                        o.profile['tag'] = random.choice(['visualization', 'c++'])
                
                o.p.randomize_in_rect(o.group.p.x, o.group.p.y, o.group.w, o.group.h)
                #res = self.post('%s/new_agent' % self.agents_url, dict(username='agent%s'%i))
                self.obj.append(o)
                i += 1
        
        lines = open('waypoints.txt').readlines()
        for line in lines:
            entries = line.strip().split()
            wid = int(entries[0])
            x = int(entries[1])
            y = int(entries[2])
            n1 = int(entries[3])
            
            self.groups[0].waypoints[wid] = Waypoint(wid, Point(x, y))
            self.groups[0].waypoints[wid].next[n1] = 1
            
            if len(entries) == 5:
                n2 = int(entries[4])
                self.groups[0].waypoints[wid].next[n2] = 1
                
                
    def post_location(self):
        #for obj in self.obj:
            #obj.col = (125,125,125)
        
        bucket = min(100, self.n)
        for i in xrange(0, self.n, bucket):
            agents = {}
            for j in xrange(bucket):
                a = self.obj[i+j]
                lat = self.lat_start + self.lat_height * a.p.y/self.height
                lon = self.lon_start + self.lon_width * a.p.x/self.width
                dic = dict(agent=a.name, signature='nosign', lon=lon, lat=lat, threshold=a.threshold)
                agents[a.name] = {'current location':dic}
            
            try:
                res = self.post('%s/batch_location' % self.agents_url, dict(data=json.dumps(agents)))
                print res['response_time']
            except:
                continue
        
    def post_profile(self):
        bucket = min(100, self.n)
        response_time = 0
        for i in xrange(0, self.n, bucket):
            print 'profile posting', i
            agents = {}
            
            for j in xrange(bucket):
                a = self.obj[i+j]
                agents[a.name] = a.profile
            #print 'posting'
            #try:
            res = self.post('%s/batch_profile' % self.agents_url, dict(data=json.dumps(agents)))
            rt = res['response_time']
            #print 'rt is', rt
            response_time += rt
            time.sleep(0.005)
            #except:
                #continue
        #print 'XXXXXXXXXXX'
        print 'total time', response_time
        
    def post_buysell(self):
        bucket = min(100, self.n)
        response_time = 0
        print 'BUYSELL'
        for i in xrange(0, self.n, bucket):
            agents = {}
            
            for j in xrange(bucket):
                a = self.obj[i+j]
                if random.random() > 0.8:
                    agents[a.name] = {"0":json.dumps(a.buysell)}
            
            #try:
            res = self.post('%s/batch_buysell' % self.agents_url, dict(data=json.dumps(agents)))
            rt = res['response_time']
            print rt
            response_time += rt
            time.sleep(0.005)
            #except:
                #continue
            
        print 'total time', response_time
    
    def get_monitor_info(self):
        pass
    
    def run(self):
        
        #self.post_profile()
        
        self.post_buysell()
        
        while self.go:
            time.sleep(1)
            continue
            
            did_nothing = True
            
            #if time.time() - self.last_post['location'] >= 0.03:
                ##start = time.time()
                #self.post_location()
                ##print 'posted location in', (time.time()-start)
                #self.last_post['location'] = time.time()
                #did_nothing = False
                
            if time.time() - self.last_post['profile'] > 10:
                start = time.time()
                self.post_profile()
                #print 'posted profile in', (time.time()-start)
                self.last_post['profile'] = time.time()
                did_nothing = False
                
            if time.time() - self.last_post['buysell'] > 10:
                #print 'posted buysell'
                self.post_buysell()
                self.last_post['buysell'] = time.time()
                did_nothing = False
            
            if time.time() - self.last_get > 0.1:
                #print 'getting monitor info'
                self.get_monitor_info()
                self.last_get = time.time()
                did_nothing = False
            
            if did_nothing:
                time.sleep(0.001)
            
    def post(self, uri, data):
        headers = {'Content-type': 'application/x-www-form-urlencoded'}
        resp, content = self.h.request(uri, "POST", headers=headers, body=urllib.urlencode(data))
        res = json.loads(content)
        if res['error']:
            print res['error']
        return res
        
class Location_poster(Thread):
    def __init__(self, scenario):
        Thread.__init__(self)
        self.scenario = scenario
        self.last_post = 0
        self.go = 1
        self.h = httplib2.Http()
        self.r = redis.Redis(host='localhost', port=6379, db=0)
    def run(self):
        while self.go:
            if time.time() - self.last_post > 0.03:
                self.last_post = time.time()
                
                t = time.time()
                
                agents = {}
                for j in xrange(self.scenario.n):
                    a = self.scenario.obj[j]
                    lat = self.scenario.lat_start + self.scenario.lat_height * a.p.y/self.scenario.height
                    lon = self.scenario.lon_start + self.scenario.lon_width * a.p.x/self.scenario.width
                    dic = dict(agent=a.name, signature='nosign', lon=lon, lat=lat, threshold=a.threshold)
                    agents[a.name] = {'current location':dic}
                
                #res = self.post('http://localhost:10002/batch_location', dict(data=json.dumps(agents)))
                
                #print 't1', time.time()-t
                t = time.time()
                
                key = 'current location'
                resolution = 100000
                pipe = self.r.pipeline()
                
                for agent, loc in agents.items():
                    lat = loc[key]['lat']
                    lon = loc[key]['lon']
                    pipe.getset('%s:location:%s:lat' % (agent, key), lat)
                    pipe.getset('%s:location:%s:lon' % (agent, key), lon)
                    
                result = pipe.execute()
                pipe = self.r.pipeline()
                
                #print 't2', time.time()-t
                t = time.time()
                
                for i, agent in enumerate(agents.keys()):
                    oldlat = result[2*i]
                    oldlon = result[2*i+1]
                    
                    if oldlat and oldlon:
                        lat = float(oldlat)
                        lon = float(oldlon)
                        latbucket = 1.0 * int(lat * resolution) / resolution
                        lonbucket = 1.0 * int(lon * resolution) / resolution

                        bucket = '%s %s' % (latbucket, lonbucket)
                        pipe.srem('location:%s:latlon:%s' % (key, bucket), agent)
                    else:
                        print 'errr', agent, 'didnt exist?'
                        pipe.incr('location:count:%s' % key)
                    
                    lat = float(agents[agent][key]['lat'])
                    lon = float(agents[agent][key]['lon'])
                    
                    latbucket = 1.0 * int(lat * resolution) / resolution
                    lonbucket = 1.0 * int(lon * resolution) / resolution

                    bucket = '%s %s' % (latbucket, lonbucket)
                    pipe.sadd('location:%s:buckets' % key, bucket)
                    pipe.sadd('location:%s:latlon:%s' % (key, bucket), agent)
                
                result = pipe.execute()
                
                #print 't3', time.time()-t
                t = time.time()
                
                #print 'locpost round in', time.time()-self.last_post
            else:
                time.sleep(0.001)
                
    def post(self, uri, data):
        headers = {'Content-type': 'application/x-www-form-urlencoded'}
        resp, content = self.h.request(uri, "POST", headers=headers, body=urllib.urlencode(data))
        res = json.loads(content)
        if res['error']:
            print res['error']
        return res
        
import redis
class Poller(Thread):
    def __init__(self, scenario):
        Thread.__init__(self)
        self.scenario = scenario
        self.last_post = 0
        self.go = 1
        self.h = httplib2.Http()
        self.r = redis.Redis(host='localhost', port=6379, db=0)
        self.monitor = 1
        self.previous_count = 0
    def run(self):
        while self.go:
            if time.time() - self.last_post > 0.1:
                self.last_post = time.time()
                
                controller = self.r.get('control:controller') or ''
                entries = self.r.get('control:entries') or '[]'
                
                if controller.startswith('agent'):
                    aid = int(controller[5:])
                else:
                    continue
                    #aid = selfFFitor
                    #controller = 'agent%s' % aid
                
                
                for obj in self.scenario.obj:
                    obj.mon = {}
                
                threshold = 0.0001
                entries = json.loads(entries)
                
                query = []
                matches = {}
                targetmatch = 0
                
                self.scenario.obj[aid].mon['location'] = 1
                self.scenario.obj[aid].threshold = threshold
                
                caps = {}
                for entry in entries:
                    cap = entry[0]
                    key = entry[1]
                    val = entry[2]
                    if cap not in caps:
                        caps[cap] = {}
                    if key not in caps[cap]:
                        caps[cap][key] = []
                    caps[cap][key].append(val)
                
                #dic = dict(data=json.dumps(entries))
                #uri = 'http://localhost:22222/multimatch?%s' % urllib.urlencode(dic)
                #res = self.post(uri, {}, method='GET')
                
                #for group in res['matches']:
                    #targetmatch += 1
                    #for match in group[4]:
                        #try:
                            #matches[match] += 1
                        #except:
                            #matches[match] = 1
                
                #if matches:
                    #for obj in self.scenario.obj:
                        #obj.col = (125,125,125)
                
                #count = 0
                #for agent in matches:
                    #if matches[agent] < targetmatch:
                        #continue
                    #if agent.startswith('agent'):
                        #count += 1
                        #taid = int(agent[5:])
                        #self.scenario.obj[taid].col = (255,10,10)
                
                
                count = 0
                radius = 70
                reset = False
                for o in self.scenario.obj:
                    ismatch = True
                    for cap in caps:
                        for key in caps[cap]:
                            if cap == 'location' and key == 'current location':
                                if abs(o.p.x - self.scenario.obj[aid].p.x) > radius:
                                    ismatch = False
                                if abs(o.p.y - self.scenario.obj[aid].p.y) > radius:
                                    ismatch = False
                            else:
                                for val in caps[cap][key]:
                                    if key not in eval('o.%s'%cap):
                                        ismatch = False
                                    elif val != eval('o.%s'%cap)[key]:
                                        ismatch = False
                            reset = True
                    if ismatch:
                        matches[o.id] = 1
                
                if reset:
                    for obj in self.scenario.obj:
                        obj.col = (125,125,125)
                        obj.size = 2
                        
                for m in matches:
                    self.scenario.obj[m].col = (255,10,10)
                    self.scenario.obj[m].size = 5
                    count += 1
                
                diff = count - self.previous_count
                if diff > 1:
                    if diff > 8:
                        diff = 8
                    self.scenario.sound[diff].play()
                self.previous_count = count
                
                
                #print
                #print 'controller:', aid, controller
                #print 'using:', entries
                #print 'found:', count
                #print 'poller round in', time.time()-self.last_post
            else:
                time.sleep(0.001)
                
    def post(self, uri, data, method='POST'):
        headers = {'Content-type': 'application/x-www-form-urlencoded'}
        resp, content = self.h.request(uri, method, headers=headers, body=urllib.urlencode(data))
        try:
            res = json.loads(content)
            if res['error']:
                print res['error']
        except:
            res = {}
            print content
        
        return res
        
def main():
    # Initialise screen
    pygame.init()
    width, height = 1024, 768
    screen = pygame.display.set_mode((width, height))
    pygame.display.set_caption('Ego table')

    # Fill background
    image = load_png('table_back2.bmp')
    background = pygame.Surface(screen.get_size())
    background = background.convert()
    background.fill((255,255,255))
    #background.set_alpha(0) 

    fullscreen = False
    balls = []
    ballsprites = []
    
    scenario = Scenario(width, height)
    scenario.start()
    
    location_poster = Location_poster(scenario)
    location_poster.start()
    
    poller = Poller(scenario)
    poller.start()
    
    # Blit everything to the screen
    screen.blit(background, (0, 0))
    pygame.display.flip()

    # Initialise clock
    clock = pygame.time.Clock()
    fps_font = pygame.font.SysFont('Verdana', 15)
    font = pygame.font.SysFont('Verdana', 40)

    go = 1
    last_post = time.time()

    highlight_wp = -1
    highlight_group = -1
    choose_next = False
    show_waypoints = False
    while go:
        clock.tick(10)
        
        for event in pygame.event.get():
            if event.type == QUIT:
                go = 0
            elif event.type == MOUSEBUTTONDOWN:
                clicked_on_waypoint = False
                print  event.pos
                
                for group in scenario.groups:
                    for wpid, waypoint in group.waypoints.items():
                        if abs(waypoint.x - event.pos[0]) < 6 and abs(waypoint.y - event.pos[1]) < 6:
                            if choose_next:
                                if wpid == highlight_wp:
                                    highlight_wp = -1
                                else:
                                    if highlight_wp >= 0:
                                        if wpid in group.waypoints[highlight_wp].next:
                                            del group.waypoints[highlight_wp].next[wpid]
                                        else:
                                            group.waypoints[highlight_wp].next[wpid] = 1
                            else:
                                if highlight_wp == wpid:
                                    highlight_wp = -1
                                else:
                                    highlight_wp = wpid
                                    highlight_group = group
                                
                                print wpid, highlight_wp
                                
                            clicked_on_waypoint = True
                        
                if clicked_on_waypoint == False:
                    if highlight_wp != -1 and choose_next == False:
                        highlight_group.waypoints[highlight_wp].x = event.pos[0]
                        highlight_group.waypoints[highlight_wp].y = event.pos[1]
                    
                    
                for obj in scenario.obj:
                    if abs(obj.p.x - event.pos[0]) < 3 and abs(obj.p.y - event.pos[1]) < 3:
                        print obj.id, obj.p.x, obj.p.y
                        poller.monitor = obj.id
                        
            elif event.type == KEYDOWN:
                if event.key > 48 and event.key < 58:
                    poller.monitor = event.key-48
                    #for o in scenario.obj:
                        #o.col = (125,125,125)
                        #o.size = 3
                        #if o.id > 100 *(event.key-48) and o.id < 100*(event.key-48) + 100:
                            #o.col = (255,0,0)
                            #o.size = 8
                
                if event.key == K_c:
                    choose_next = not choose_next
                    
                if event.key == K_w:
                    show_waypoints = not show_waypoints
                
                if event.key == K_n:
                    maxwp = max(scenario.groups[0].waypoints.keys())
                    print maxwp
                    scenario.groups[0].waypoints[maxwp+1] = Waypoint(maxwp+1, Point(100,100))
                    
                if event.key == K_p:
                    for group in scenario.groups:
                        for wpid, waypoint in group.waypoints.items():
                            next = ' '.join(['%s'%x for x in waypoint.next.keys()])
                            print '%s %s %s %s' % (wpid, waypoint.x, waypoint.y, next)
                    
                if event.key == K_f:
                    if fullscreen:
                        pygame.display.set_mode((width, height), pygame.DOUBLEBUF)
                    else:
                        pygame.display.set_mode((width, height), pygame.FULLSCREEN)
                    fullscreen = not fullscreen
                    
                if event.key in [K_q,27]:
                    go = 0
        
        #screen.blit(background, (0, 0))
        screen.blit(image, (0, 0))
        
        for o in scenario.obj:
            o.update()
            o.draw(screen, scenario.height, scenario.lat_height)
        
        for group in scenario.groups:
            for wpid, waypoint in group.waypoints.items():
                color = (255,10,10)
                if wpid == highlight_wp:
                    color = (10,255,10)
                if highlight_wp >= 0:
                    if wpid in group.waypoints[highlight_wp].next:
                        color = (10,10,255)
                
                if show_waypoints:
                    pygame.draw.circle(screen, color, (waypoint.x, waypoint.y), 5, 0)
        
        if choose_next:
            pygame.draw.rect(screen, (10,10,255), (970, 20, 30, 30), 0)
            
        #scenario.draw(screen)
        
        fps_text = fps_font.render('fps: ' + str('%.2f' % clock.get_fps()), True, (0,0,0), (255,255,255))
        fps_rect = fps_text.get_rect()
        screen.blit(fps_text, fps_rect)
        
        pygame.display.flip()

    scenario.go = 0
    location_poster.go = 0
    poller.go = 0
    
if __name__ == '__main__':
    main()
        