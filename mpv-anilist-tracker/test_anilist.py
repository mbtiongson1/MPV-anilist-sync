import requests

query = '''
query ($search: String) {
    Media (search: $search, type: ANIME) {
        id
        title {
            romaji
        }
    }
}
'''
variables = {'search': 'Sousou no Frieren'}
url = 'https://graphql.anilist.co'
response = requests.post(url, json={'query': query, 'variables': variables})
print(response.json())
