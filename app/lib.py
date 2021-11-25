from bs4 import BeautifulSoup
import base64
import datetime
import redis
from logzero import logger
import os
import json

import requests

user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36'
headers = {"User-Agent": user_agent}

session = requests.Session()

r = redis.Redis(host=os.environ['REDISHOST'], port=os.environ['REDISPORT'],
                username=os.environ['REDISUSER'], password=os.environ['REDISPASSWORD'], db=0, decode_responses=True)


def get_languages_live():
    global user_agent, headers, session
    lang_url = 'https://replit.com/languages'
    r = session.get(lang_url, headers=headers)

    if(not r.ok):
        raise Exception(
            "Couldn't get languages from upstream! http error: {0}".format(r.status_code))

    html_text = r.text
    soup = BeautifulSoup(html_text, 'html.parser')

    scripts = soup.find_all('script', type="text/javascript")
    script = None
    for s in scripts:
        if ('KNOWN_LANGUAGES' in s.string):
            script = s.string

    if (script is None):
        raise Exception("Couldn't find languages in upstream!")

    # String looks like: lsdkf'<base_64_string>'lkdfj
    # This extracts it
    languages_base64 = script[script.find("'") +
                              1:script.find("'",
                                            script.find("'") + 1)]

    base64_bytes = languages_base64.encode('ascii')
    languages_json_bytes = base64.b64decode(base64_bytes)
    languages_json = languages_json_bytes.decode('ascii')
    return languages_json


def get_languages_cached():
    key = 'x:languages_cached'
    try:
        cached = json.loads(r.get(key))
    except Exception as e:
        cached = None  # default to getting live if db fails
        logger.exception(e)

    def get_age(timestamp_str):
        now = datetime.datetime.now()
        then = datetime.datetime.fromtimestamp(float(timestamp_str))
        return now - then

    max_age = datetime.timedelta(days=1)
    # If cache is empty or expired try to get from upstream.
    # But if upstream fails and we do have a cache then use cache.
    if (cached is None or get_age(cached['timestamp']) > max_age):
        logger.info('getting live')
        try:
            languages_live = get_languages_live()
        except Exception as e:
            logger.exception(e)
            # Use cached data if we can since upstream failed
            if (cached is not None):
                return cached['languages']
            else:
                raise  # Send upstream (will send a 500 error to user)
        timestamp = datetime.datetime.now().timestamp()
        pair = {'timestamp': str(timestamp), 'languages': languages_live}
        try:
            r.set(key, json.dumps(pair))
        except Exception as e:  # If db fails we'll try again next time
            logger.exception(e)
        return languages_live
    else:  # return cached
        logger.info('using cached')
        return cached['languages']
