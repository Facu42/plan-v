import json
import os
import time

OUT = os.path.abspath('.scratch/nutrigo-typography')
os.makedirs(OUT, exist_ok=True)


def body():
    return js('document.body.innerText') or ''


def click(text, selector='button'):
    ok = js(f'''(() => {{const n=[...document.querySelectorAll({json.dumps(selector)})].find(e=>e.textContent.trim()==={json.dumps(text)});if(!n)return false;n.click();return true}})()''')
    if not ok:
        raise AssertionError('No se encontró '+text)


def styles_of(selectors):
    return js(f'''(() => {{const pick=(e,props)=>{{if(!e)return null;const s=getComputedStyle(e);const o={{}};props.forEach(p=>o[p]=s[p]);const r=e.getBoundingClientRect();o.rect={{w:Math.round(r.width),h:Math.round(r.height)}};return o}};const S={json.dumps(selectors)};const out={{}};for(const [k,sel,props] of S) out[k]=pick(document.querySelector(sel),props);return out}})()''')

SEL = [
    ['body', '.nv-app', ['fontSize', 'fontWeight', 'lineHeight', 'color', 'backgroundColor']],
    ['h1', '.nv-page-head h1', ['fontSize', 'fontWeight', 'letterSpacing']],
    ['head_p', '.nv-page-head p', ['fontSize', 'color']],
    ['nav_btn', '.nv-sidebar nav button', ['fontSize', 'fontWeight', 'minHeight', 'borderRadius']],
    ['nav_current', '.nv-sidebar nav button[aria-current="page"]', ['fontWeight', 'backgroundColor', 'color']],
    ['card', '.np-chart-grid .nv-card', ['padding', 'borderRadius', 'backgroundColor']],
    ['card_h2', '.np-chart-grid .nv-card-head h2', ['fontSize', 'fontWeight']],
    ['metric', '.np-metrics .nv-metric', ['padding', 'borderRadius', 'minHeight']],
    ['metric_label', '.np-metrics .nv-metric h2', ['fontSize', 'fontWeight', 'color']],
    ['metric_value', '.np-metrics .nv-metric>strong', ['fontSize', 'fontWeight', 'letterSpacing']],
    ['metric_note', '.np-metrics .nv-metric>small', ['fontSize', 'color']],
    ['icon_tile', '.np-metrics .nv-icon-tile', ['width', 'height', 'borderRadius', 'backgroundColor']],
    ['badge', '.np-plan-meal .nv-badge', ['fontSize', 'fontWeight', 'borderRadius', 'padding']],
    ['followup_btn', '.np-followup-grid>button', ['borderRadius', 'padding', 'backgroundColor']],
    ['followup_icon', '.np-action-icon', ['width', 'height', 'borderRadius']],
    ['rail_meal_photo', '.nv-agenda-meals .np-food-photo', ['width', 'height', 'borderRadius']],
    ['gauge_strong', '.np-gauge strong', ['fontSize', 'fontWeight']],
    ['macro_value', '.np-macro-row>strong', ['fontSize', 'fontWeight']],
    ['plan_meal_title', '.np-plan-meal>strong', ['fontSize', 'fontWeight']],
    ['button', '.np-menu-card .nv-button.nv-ghost', ['fontSize', 'fontWeight', 'minHeight']],
]


def enter(role):
    click('Continuar en modo demo')
    for _ in range(60):
        if 'Hola, Sofía.' in body(): break
        time.sleep(.1)
    if role == 'pro':
        click('Nutricionista', '.nv-role-switch button')
        for _ in range(60):
            if 'Mi trabajo' in body(): break
            time.sleep(.1)
    time.sleep(.4)


def measure(theme, role, tag):
    js(f"localStorage.setItem('plan-v:theme',{json.dumps(theme)}); location.reload()")
    wait_for_load()
    for _ in range(60):
        if 'Continuar en modo demo' in body(): break
        time.sleep(.1)
    enter(role)
    data = styles_of(SEL)
    data['theme_detected'] = js("document.querySelector('.nv-app').classList.contains('nv-dark')")
    data['scrollW'] = js('document.documentElement.scrollWidth')
    print(json.dumps({tag: data}, ensure_ascii=False))
    print(capture_screenshot(path=os.path.join(OUT, tag + '.png'), full=False))


new_tab('http://127.0.0.1:5180/')
wait_for_load()
cdp('Emulation.setDeviceMetricsOverride', width=1440, height=1232, deviceScaleFactor=1, mobile=False)
measure('light', 'patient', 'patient-light')
measure('dark', 'patient', 'patient-dark')
measure('light', 'pro', 'pro-light')
measure('dark', 'pro', 'pro-dark')
