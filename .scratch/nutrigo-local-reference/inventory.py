import json
from pathlib import Path
from collections import Counter, defaultdict

root = Path(__file__).resolve().parent
nodes = json.loads((root / 'decoded.json').read_text(encoding='utf-8'))['nodeChanges']
def key(guid):
    return f"{guid.get('sessionID')}:{guid.get('localID')}"
by_id = {key(n['guid']): n for n in nodes}
children = defaultdict(list)
for n in nodes:
    children[key(n.get('parentIndex', {}).get('guid', {}))].append(n)
def descendants(n):
    yield n
    for child in children[key(n['guid'])]:
        yield from descendants(child)

pages = [n for n in nodes if n.get('type') == 'CANVAS']
result = []
for page in pages:
    frames = []
    for frame in children[key(page['guid'])]:
        if frame.get('type') != 'FRAME':
            continue
        subtree = list(descendants(frame))
        text = [x for x in subtree if x.get('type') == 'TEXT']
        frames.append({
            'id': key(frame['guid']), 'name': frame.get('name'), 'size': frame.get('size'),
            'fonts': dict(Counter(x.get('fontName', {}).get('family', '(inherited)') for x in text)),
            'children': [{'id': key(x['guid']), 'name': x.get('name'), 'type': x.get('type'), 'size': x.get('size'), 'transform': x.get('transform')} for x in children[key(frame['guid'])]],
            'texts': [x.get('textData', {}).get('characters', x.get('name', '')) for x in text],
        })
    result.append({'id': key(page['guid']), 'name': page.get('name'), 'frames': frames})
(root / 'inventory.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
for page in result:
    print('PAGE', page['id'], ascii(page['name']), 'frames', len(page['frames']))
    for frame in page['frames']:
        print(frame['id'], ascii(frame['name']), frame['size'], frame['fonts'])
