#!/usr/bin/env python

import json
import requests
import unittest
import random
import string

HOST='http://localhost:7999'
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

class V1RepoTests(unittest.TestCase):
    STORE_ID=''.join([random.choice(string.digits + string.letters) for i in range(0, 10)])
    API_PATH=HOST + '/api/v1/repo/create'

    def test_create_repo(self):
        payload={
            "repo_name": self.STORE_ID
        }
        print 'Creating Repo ', self.STORE_ID
        return requests.put(self.API_PATH, data=json.dumps(payload), headers=HEADERS, verify=False)

class V2RepoTests(unittest.TestCase):
    STORE_ID=''.join([random.choice(string.digits + string.letters) for i in range(0, 10)])
    API_PATH=HOST + '/api/v2/store/{0}'.format(STORE_ID)

    @classmethod
    def setUpClass(cls):
        print 'Creating repo ', cls.STORE_ID
        requests.put(cls.API_PATH, data=json.dumps({}), headers=HEADERS, verify=False)
        payload={
            "hash": None,
            "changes": [
                {"key": "readme.md", "value": "Default file"},
            ]
        }
        requests.post(cls.API_PATH, data=json.dumps(payload), headers=HEADERS, verify=False)

    def test_already_exists(self):
        r = requests.put(self.API_PATH, data=json.dumps({}), headers=HEADERS, verify=False)
        self.assertEqual(r.status_code, 409)

    def test_get(self):
        payload={ "hash": None }
        r = requests.get(self.API_PATH, data=json.dumps(payload), headers=HEADERS, verify=False)
        print 'Test Get'
        print '\t', r.text
        self.assertEqual(r.status_code, 200)
        last_hash = r.json()['hash']

        payload={ "hash": "thisisabadhash" }
        r = requests.get(self.API_PATH, data=json.dumps(payload), headers=HEADERS, verify=False)
        print 'Test Bad Hash '
        print '\t', r.text
        self.assertEqual(r.status_code, 404)

        payload={ "hash": last_hash }
        r = requests.get(self.API_PATH, data=json.dumps(payload), headers=HEADERS, verify=False)
        print 'Test Last Hash ', last_hash
        print '\t', r.text
        self.assertEqual(r.status_code, 200)

    def test_put(self):
        payload={ "hash": None }
        r = requests.get(self.API_PATH, data=json.dumps(payload), headers=HEADERS, verify=False)
        print 'Get First Hash '
        print '\t', r.text
        self.assertEqual(r.status_code, 200)
        first_hash = r.json()['hash']

        payload={
            "hash": first_hash,
            "changes": [
                {"key": "file1.txt", "value": "This is file 1"},
                {"key": "file2.txt", "value": "This is file 2"},
                {"key": "file3.txt", "value": "This is file 3"},
            ]
        }
        r = requests.post(self.API_PATH, data=json.dumps(payload), headers=HEADERS, verify=False)
        self.assertEqual(r.status_code, 200)
        print 'Test Put'
        print '\t', r.text
        # Results should have 3 entries, file1.txt, file2.txt, file3.txt
        self.assertEqual(len(r.json()['changes']), 3)
        second_hash = r.json()['hash']

        payload={ "hash": second_hash }
        r = requests.get(self.API_PATH, data=json.dumps(payload), headers=HEADERS, verify=False)
        print 'Test Previous Hash ', second_hash
        print '\t', r.text
        self.assertEqual(r.status_code, 200)

        payload={
            "hash": second_hash,
            "changes": [
                {"key": "file3.txt", "value": "NEW VALUE FOR 3"},
            ]
        }
        r = requests.post(self.API_PATH, data=json.dumps(payload), headers=HEADERS, verify=False)
        self.assertEqual(r.status_code, 200)
        print 'Test Put Change File 3'
        print '\t', r.text
        
        payload={ "hash": None }
        r = requests.get(self.API_PATH, data=json.dumps(payload), headers=HEADERS, verify=False)
        print 'Test Entire History'
        print '\t', r.text
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()['changes']), 4)
        last_hash = r.json()['hash']

        payload={ "hash": second_hash }
        r = requests.get(self.API_PATH, data=json.dumps(payload), headers=HEADERS, verify=False)
        print 'Test Previous Hash ', second_hash
        print '\t', r.text
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()['changes']), 1)

        payload={ "hash": last_hash }
        r = requests.get(self.API_PATH, data=json.dumps(payload), headers=HEADERS, verify=False)
        print 'Test Last Hash ', last_hash
        print '\t', r.text
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()['changes']), 0)


if __name__ == '__main__':
    unittest.main()

