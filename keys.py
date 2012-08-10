import time

def getK (context):            return 'profile:%s:keys'                 % (context)
def getKA(context, key):       return 'profile:%s:key:%s:agents'        % (context, key)
def getKV(context, key):       return 'profile:%s:key:%s:values'        % (context, key)
def getKVA(context, key, val): return 'profile:%s:key:%s:val:%s:agents' % (context, key, val)


# def getvid(r, k,v):
    # return r.get('profile:composite:key:%s:val:%s' % (k, v))

def getcid(r, context):
    return r.get('context:%s:cid' % context)

def getlid(r, k,v):
    return r.smembers('profile:composite:key:%s:val:%s' % (k, v))

def add_location(r, lid, title, lat, lon, radius, creator):
    error = ''
    if not lid:
        if title:
            latlonstr = '%s %s' % (lat, lon)

            if r.sadd('location:latlonstrings', latlonstr):
                ldic = dict(title=title, lat=lat, lon=lon, radius=radius, creator=creator)
                lid = r.incr('global:nextlid')
                r.hmset('location:lid:%s' % lid, ldic)
                r.sadd('location:titles', title)
                r.sadd('location:title:%s' % title, lid)
                r.set('location:latlonstring:%s:lid' % latlonstr, lid)
            else:
                lid = r.get('location:latlonstring:%s:lid' % latlonstr)
                error = 'attempt to add existing center, returned existing lid %s' % lid
                print 'WARNING: add_location: %s' % error
        else:
            error = 'no title provided'
            print error
    return dict(lid=lid, error=error)
    

def annotate(r, k, v, ktype, dic):
    r.sadd('profile:keytypes', 'string', 'location', 'time', 'user')
    r.set('profile:key:%s:type' % k, ktype)

    vid = dic['id']
    if not r.hgetall('%s:lid:%s' % (ktype,vid)):
        print 'WARNING: annotating kv with empty xdata entry:', ktype, k,v,vid
    print 'annontate', r.sadd('profile:composite:key:%s:val:%s' % (k, v), vid)


def deannotate(r, c, k, v):
    return
    # r.sadd('profile:keytypes', 'string', 'location', 'time', 'user')
    # r.set('profile:key:%s:type' % k, ktype)

    vid = getlid(r, k,v)
    if vid:
        r.delete('location:lid:%s' % vid)
        r.delete('profile:composite:key:%s:val:%s' % (k, v), vid) 


def getfullkv(r, c,k,v):
    res = []
    for vid in getlid(r, k,v):
        dic = r.hgetall('location:lid:%s' % vid)
        dic['ktype'] = r.get('profile:key:%s:type' % k)
        dic['id'] = vid
        res.append(dic)
    return res



def set_user_option(r, username, option, value):
    return r.hset('options:user:%s' % username, 'alert:%s'%option, value)
def get_user_option(r, username, option):
    return r.hget('options:user:%s' % username, 'alert:%s'%option)


def doalert(r, atype, c, k, v, u):
    if c == 'all':
        return

    matches = []
    if atype == 'onvalueadded':
        matches = r.smembers(getKVA(c, k, v)) - set([u])
    if atype == 'onvaluecreated':
        matches = r.smembers(getKA(c, k)) - set([u])
    if atype == 'onattribute':
        cid = r.get('context:title:%s:cid' % c)
        matches = r.smembers('context:cid:%s:users' % cid) - set([u])
    if atype == 'onapplication':
        # matches = r.smembers('context:cid:%s:users' % c)
        pass

    for umatch in matches:
        storedOption = get_user_option(r, umatch, atype)
        if storedOption == 'True':
            umatch
            alert = dict(
                atype=atype, 
                key=k, 
                val=v, 
                context=c, 
                user=u,
                tstamp=time.time())
            r.rpush('user:%s:alerts' % umatch, alert)
            print umatch, alert


    # print 'alert', atype, k, v, u, c


def add_context(r, context, username):
    print
    print 'add_context', context
    cid = context.get('id')
    if r.hgetall('context:cid:%s' % cid):
        print 'WARNING: add_context: cid already exists:', cid
        return cid
    else:
        if r.sismember('contexts', context['title']):
            print 'ERROR: add_context: context title already exists: cid:', r.get('context:title:%s:cid' % context['title'])
            return None

        lid = None
        ldic = context.get('location')

        if ldic:
            lres = add_location(r, 
                                ldic.get('id'), 
                                ldic['title'], 
                                ldic['lat'], 
                                ldic['lon'], 
                                ldic['radius'], 
                                ldic.get('creator',username))
            lid = lres['lid']
            # r.set('context:%s:lid' % c, lid)

        cid = r.incr('global:nextcid')
        cdic = dict(id=cid,
                    title=context['title'], 
                    description=context['description'],
                    lid=lid)
        
        r.set('context:%s:cid' % context['title'], cid)
        r.hmset('context:cid:%s' % cid, cdic)
        r.set('context:title:%s:cid' % context['title'], cid)
        r.sadd('contexts', context['title'])
        return cid




