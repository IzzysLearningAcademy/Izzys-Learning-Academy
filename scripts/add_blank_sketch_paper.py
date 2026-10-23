from pathlib import Path
p=Path('academy.html')
s=p.read_text(encoding='utf-8')
assert "btn('royalGraph', '▦ Graph'" in s
assert "function setPaper(k)" in s
assert ".izsp-paper.graph{" in s
s=s.replace(".izsp-paper.graph{", ".izsp-paper.blank{background-image:none;background-color:#fffdf8}\n.izsp-paper.graph{",1)
s=s.replace("btn('royalGraph', '▦ Graph', 'izsp-tool', () => setPaper('graph'), {'aria-pressed': 'false'}),","btn('royalGraph', '▦ Graph', 'izsp-tool', () => setPaper('graph'), {'aria-pressed': 'false'}), btn('royalBlank', '□ Blank', 'izsp-tool', () => setPaper('blank'), {'aria-pressed': 'false'}),",1)
old="function setPaper(k) { paperKind = k; paper.classList.toggle('graph', k === 'graph'); $('royalLines').classList.toggle('on', k === 'lined'); $('royalGraph').classList.toggle('on', k === 'graph'); $('royalLines').setAttribute('aria-pressed', String(k === 'lined')); $('royalGraph').setAttribute('aria-pressed', String(k === 'graph')); }"
assert old in s
new="function setPaper(k) { paperKind = k; paper.classList.toggle('graph', k === 'graph'); paper.classList.toggle('blank', k === 'blank'); for (const [id,kind] of [['royalLines','lined'],['royalGraph','graph'],['royalBlank','blank']]) { $(id).classList.toggle('on', k === kind); $(id).setAttribute('aria-pressed', String(k === kind)); } }"
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('Added Blank Paper; left eraser, strokes, undo and clear logic unchanged.')
