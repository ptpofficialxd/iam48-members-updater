import requests
import random
from collections import defaultdict
from pathlib import Path

URL = "https://user-agents.net/download"
OUTPUT_FILE = Path("user_agents.txt")


def download_user_agents() -> list[str]:
    """Download raw user-agent strings from the source."""
    payload = {"browser": "dalvik", "download": "txt"}
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    response = requests.post(URL, data=payload, headers=headers)

    if response.status_code == 200:
        return response.text.splitlines()
    else:
        raise RuntimeError(f"Failed to fetch user agents. Status code: {response.status_code}")


def filter_android_agents(user_agents: list[str]) -> dict[str, list[str]]:
    """Filter only valid Android UA (Android 10+), grouped by version."""
    versions: dict[str, list[str]] = defaultdict(list)

    for ua in user_agents:
        if "Android" not in ua:
            continue

        version_index = ua.find("Android") + len("Android ")
        version = ua[version_index : version_index + 2]

        if not version.isdigit() or int(version) < 10:
            continue

        # skip unwanted formats
        if ("(Linux; U" in ua and not ua.endswith(")")) or "appId" in ua or "appVersion" in ua:
            continue

        versions[version].append(ua)

    return versions


def sample_user_agents(versions: dict[str, list[str]], per_version: int = 50) -> list[str]:
    """Sample up to N user-agents per Android version."""
    sampled = []
    for version, ua_list in versions.items():
        if len(ua_list) > per_version:
            sampled.extend(random.sample(ua_list, per_version))
        else:
            sampled.extend(ua_list)
    return sampled


def save_user_agents(user_agents: list[str], output: Path = OUTPUT_FILE) -> None:
    """Write user agents to file, one per line."""
    with output.open("w", encoding="utf-8") as f:
        for ua in user_agents:
            f.write(f"{ua}\n")


def main():
    print("[update_ua.py] Downloading user agents...")
    raw_agents = download_user_agents()
    print(f"[update_ua.py] Downloaded {len(raw_agents)} entries")

    versions = filter_android_agents(raw_agents)
    sampled = sample_user_agents(versions, per_version=50)

    save_user_agents(sampled)
    print(f"[update_ua.py] Saved {len(sampled)} user agents → {OUTPUT_FILE}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("[update_ua.py] Error:", e)
        raise
