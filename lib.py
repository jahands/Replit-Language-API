from bs4 import BeautifulSoup
from replit import db
import base64
import datetime
from logzero import logger
from dblog import dblog

import requests

user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36'
headers = {"User-Agent": user_agent}

session = requests.Session()


def get_languages_live():
    global user_agent, headers, session
    lang_url = 'https://replit.com/languages'
    r = session.get(lang_url, headers=headers)
    html_text = r.text
    soup = BeautifulSoup(html_text, 'html.parser')

    languages_base64 = soup.find_all('script',
                                     type="text/javascript")[1].string
    languages_base64 = languages_base64[languages_base64.find("'") +
                                        1:languages_base64.
                                        find("'",
                                             languages_base64.find("'") + 1)]

    base64_bytes = languages_base64.encode('ascii')
    languages_json_bytes = base64.b64decode(base64_bytes)
    languages_json = languages_json_bytes.decode('ascii')

    # languages = json.loads(languages_json)
    return languages_json

def get_languages_cached():
    key = 'x:languages_cached'
    try:
        cached = db.get(key)
    except Exception as e:
        cached = None  # default to getting live if db fails
        logger.exception(e)
        dblog(e)

    def get_age(timestamp_str):
        now = datetime.datetime.now()
        then = datetime.datetime.fromtimestamp(float(timestamp_str))
        return now - then

    max_age = datetime.timedelta(days=1)
    if (cached is None or get_age(cached['timestamp']) > max_age):
        logger.info('getting live')
        try:
            languages_live = get_languages_live()
        except Exception as e:
            logger.exception(e)
            dblog(e)
            if(cached is not None):
                # Use cached data if we can since upstream failed
                return cached
            else:
                raise # Send upstream (will send a 500 error to user)
        timestamp = datetime.datetime.now().timestamp()
        pair = {'timestamp': str(timestamp), 'languages': languages_live}
        try:
            db[key] = pair
        except Exception as e:  # If db fails we'll try again next time
            logger.exception(e)
            dblog(e)
        return languages_live
    else:  # return cached
        logger.info('using cached')
        return cached['languages']
