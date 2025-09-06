import requests
import random
from collections import defaultdict

def fetch_user_agents():
    url = 'https://user-agents.net/download'
    payload = {
        'browser': 'dalvik',
        'download': 'txt'
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    response = requests.post(url, data=payload, headers=headers)

    if response.status_code == 200:
        user_agents = response.text.splitlines()
        versions = defaultdict(list)

        for ua in user_agents:
            if 'Android' in ua:
                version_index = ua.find('Android') + len('Android ')
                version = ua[version_index:version_index + 2]
                if version.isdigit() and int(version) >= 10:
                    if ('(Linux; U' in ua and not ua.endswith(')')) or 'appId' in ua or 'appVersion' in ua:
                        continue
                    versions[version].append(ua)

        sampled_agents = []
        for version, ua_list in versions.items():
            if len(ua_list) > 50:
                sampled_agents.extend(random.sample(ua_list, 50))
            else:
                sampled_agents.extend(ua_list)

        with open('user_agents.txt', 'w') as f:
            for ua in sampled_agents:
                f.write(f"{ua}\n")

    else:
        print(f"Failed to fetch user agents. Status code: {response.status_code}")

if __name__ == '__main__':
    fetch_user_agents()
