# Replit Language List 
This API gives a list of all languages and templates Replit supports.

## Response Example (truncated):
```json
{
    "api_version",
    "languages": { // contains all languages, only showing python3 here.
        "python3": {
            "displayName": "Python",
            "tagline": "A dynamic language emphasizing readability.",
            "key": "python3",
            "entrypoint": "main.py",
            "ext": "py",
            "hasLint": true,
            "hasUnitTests": true,
            "hasProjectMode": true,
            "hasFormat": true,
            "hasLibraries": false,
            "hasUPM": true,
            "hasGit": true,
            "hasEval": true,
            "hasInterpreter": true,
            "hasLanguageServer": true,
            "header": "Python 3.8.2 (default, Feb 26 2020, 02:56:10)",
            "category": "Practical",
            "icon": "https://replit.com/public/images/languages/python.svg",
            "engine": "goval",
            "isNew": false,
            "config": {
                "isServer": false,
                "isVnc": false
            }
        }
    }
}
```
[API Reference](https://replit-language-api.uuid.rocks//docs)

[Get Language List:](https://replit-language-api.uuid.rocks//api/languages)
```
GET https://replit-language-api.uuid.rocks/api/languages
```