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

def add_location(r, title, lat, lon, radius, creator):
    error = ''
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
        res.append(dic)
    return res