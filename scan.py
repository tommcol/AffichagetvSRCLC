import urllib.request
import json
import concurrent.futures
import sys

start_id = 1
end_id = 16000
concurrency = 30

print(f"Starting python concurrent scan from ID {start_id} to {end_id} with concurrency {concurrency}...", flush=True)

def check_club(club_id):
    try:
        url = f"https://ffbb-api.desimone.fr/api/v1/club/{club_id}"
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        # Set a 3-second timeout
        with urllib.request.urlopen(req, timeout=3) as response:
            if response.status == 200:
                html = response.read().decode('utf-8')
                data = json.loads(html)
                name = data.get("libelle") or data.get("nom") or data.get("nomOrganisme") or data.get("libelleOrganisme") or ""
                code = data.get("code") or data.get("codeOrganisme") or ""
                
                print(f"ID {club_id}: {name} ({code})", flush=True)
                
                if "clayette" in name.lower() or "clayettois" in name.lower() or "0071024" in code or "71024" in code:
                    print(f"\n🎉🎉🎉 FOUND CLUB! ID: {club_id}, Name: {name}, Code: {code}\n", flush=True)
                    # Use os._exit to immediately kill all threads
                    import os
                    os._exit(0)
    except Exception as e:
        pass

with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
    list(executor.map(check_club, range(start_id, end_id + 1)))

print("Scan finished, not found.", flush=True)
