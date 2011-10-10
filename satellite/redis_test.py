import redis
import time
import sqlite3

conn = sqlite3.connect(':memory:')
db = conn.cursor()

q = "CREATE TABLE `ego2_data` ("
q+= "`id` INTEGER PRIMARY KEY AUTOINCREMENT,"
q+= "`cap_id` int(11) NOT NULL,"
q+= "`usr_id` int(11) NOT NULL,"
q+= "`key` varchar(1000) NOT NULL,"
q+= "`val` varchar(1000) NOT NULL,"
q+= "`tstamp` datetime NOT NULL"
q+= ")"
res = db.execute(q)
conn.commit()

sql1  = "INSERT INTO ego2_data (`id`, `cap_id`,`usr_id`,`key`,`val`,`tstamp`)"
sql1 += "VALUES                (NULL, '0',    '0',    'foo', 'bar', '0123');"


sql = 'select count(*) from ego2_data where'
sql+= "     `usr_id`='0'"
sql+= " and `cap_id`='0'"
sql+= " and `key`   ='foo'"
sql+= " and `val`   ='bar'"


    
r = redis.Redis(host='localhost', port=6379, db=0)

rounds = 1000
for i in xrange(rounds):
    db.execute(sql1)
    conn.commit()

pipe = r.pipeline()
start = time.time()
for i in xrange(rounds):
    #pipe.set('foo', 'bar')
    #pipe.get('foo')
    r.set('foo', 'bar')
    r.get('foo')
#pipe.execute()
print 'redis', time.time()-start

start = time.time()
for i in xrange(rounds):
    db.execute(sql)
    conn.commit()
    fetchall = db.fetchall()[0][0]
    if (fetchall):
        #print 'ok', fetchall
        pass
    else:
        db.execute(sql1)
        conn.commit()

sq3 = db.execute("select count(*) from ego2_data")
conn.commit()
print 'sqlite', time.time()-start, db.fetchall()



