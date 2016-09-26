"""
Django settings for syncserver project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import sys
import os
import getpass
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.6/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'n3l=ykrfn)vwijbl6khi8^^d7b#s99n%fmzef6=-gb9z_s_#0d'

TEMPLATE_DEBUG = False
ALLOWED_HOSTS = [ '*' ]
SYS_USER = getpass.getuser()
PRODUCTION = SYS_USER in ('bitz', )
DEBUG = not PRODUCTION

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework.authtoken',
    'south',
    'restapi',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'syncserver.urls'

WSGI_APPLICATION = 'syncserver.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.6/ref/settings/#databases

DB_HOST = 'localhost'
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'syncserver',
        'USER': 'airbitz',
        'PASSWORD': 'airbitz',
        'HOST': DB_HOST,
        'PORT': '5432',
    },
}


# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/

STATIC_URL = '/static/'

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
    )
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
        'verbose':    {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        }
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'handlers': {
        'console':{
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
            'stream': sys.stdout
        },
        'catch-all':  {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
            'stream': sys.stdout
        },
        'errors':  {
            'level': 'WARNING',
            'class': 'logging.handlers.TimedRotatingFileHandler',
            'formatter': 'verbose',
            'class': 'logging.FileHandler',
            'filename': '/tmp/error.log',
        },
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': '/tmp/sync.log',
        },
    },
    'loggers': {
        'syncserver': {
            'handlers': ['file', 'console', 'catch-all', 'errors'],
            'level': 'DEBUG',
            'propogate': True,
        },
        'restapi': {
            'handlers': ['file', 'console', 'catch-all', 'errors'],
            'level': 'DEBUG',
            'propogate': True,
        },
        'django.request': {
            'handlers': ['file', 'console', 'catch-all', 'errors'],
            'level': 'ERROR',
            'propagate': True,
        },
    }
}
