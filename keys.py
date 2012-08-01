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


def annotate(r, c, k, v, ktype, dic):
    r.sadd('profile:keytypes', 'string', 'location', 'time', 'user')
    r.set('profile:key:%s:type' % k, ktype)

    vid = dic.get('id')
    if vid:
        if not r.hgetall('%s:lid:%s' % (ktype,vid)):
            print 'WARNING: annotating kv with empty xdata entry:', ktype, c,k,v,vid
        print 'used existing vid:', vid
    else:
        # vid = getlid(r, k,v) or r.incr('global:nextlid')
        vid = r.incr('global:nextlid')
        r.sadd('profile:composite:key:%s:val:%s' % (k, v), vid)
        print 'created new vid:', vid


    print 'annotate: getlid(r,k,v):', getlid(r, k,v)
    print 'annotate: vid:', vid
    print 'annotate: dic:', dic
    print r.hmset('location:lid:%s' % vid, dic)
    # print r.set('profile:composite:key:%s:val:%s' % (k, v), vid)


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