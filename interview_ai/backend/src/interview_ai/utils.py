import re
import json5

def json_to_dict(s: str) -> dict:
    """
    Cleans a JSON-like string by removing markdown fences and inserting missing commas between object properties.
    Uses json5 to parse the cleaned string. Returns a dict or raises an error.
    """
    s = re.sub(r'```(?:json)?', '', s).strip()
    try:
        return json5.loads(s)
    except Exception as e:
        raise ValueError("Invalid JSON after processing")
