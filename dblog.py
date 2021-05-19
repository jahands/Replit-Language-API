from collections import deque
from replit import db
import pytz
import datetime


logkey = 'x:logger'
if(db.get(logkey) is None):
    db[logkey] = []

def dblog(log_str):
    log = deque(db[logkey], maxlen=500)
    now = datetime.datetime.now(pytz.timezone('US/Central'))
    log.append([str(now), str(log_str)])
    db[logkey] = list(log)