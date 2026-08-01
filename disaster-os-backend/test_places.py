import asyncio
import httpx

API_KEY = "AIzaSyD1dDLlUMgc8JHQGJDsZPLynbDa5e5WfaU"

async def test():
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.id,places.nationalPhoneNumber,places.currentOpeningHours.openNow",
        "Referer": "http://localhost:3000/"
    }
    body = {
        "includedTypes": ["hospital"],
        "maxResultCount": 5,
        "locationRestriction": {
            "circle": {
                "center": {"latitude": 37.7749, "longitude": -122.4194},
                "radius": 5000,
            }
        }
    }
    async with httpx.AsyncClient() as client:
        res = await client.post("https://places.googleapis.com/v1/places:searchNearby", headers=headers, json=body)
        print("Status:", res.status_code)
        print("Body:", res.text)

asyncio.run(test())
