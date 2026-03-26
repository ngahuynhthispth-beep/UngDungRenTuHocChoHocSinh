# 🎨 Design Specifications - StudyGuard

## 🎨 Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#10b981` | Buttons, success, "Đang học" |
| Primary Dark | `#059669` | Hover states |
| Danger | `#F44336` | Alerts, "Không học" |
| Danger Dark | `#D32F2F` | Hover danger |
| Warning | `#FFC107` | "Mất tập trung" |
| Background | `#0f172a` | Main background |
| Surface | `#1e293b` | Cards, modals |
| Surface Light | `#334155` | Input fields, borders |
| Text | `#f1f5f9` | Primary text |
| Text Muted | `#94a3b8` | Secondary text |
| Text Dark | `#64748b` | Placeholder text |

## 📝 Typography

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| H1 | Inter | 32px | 700 | 1.2 |
| H2 | Inter | 24px | 600 | 1.3 |
| H3 | Inter | 20px | 600 | 1.4 |
| Body | Inter | 16px | 400 | 1.6 |
| Small | Inter | 14px | 400 | 1.5 |
| Caption | Inter | 12px | 400 | 1.4 |

**Font Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

## 📐 Spacing System

| Name | Value | CSS Variable |
|------|-------|--------------|
| xs | 4px | --space-xs |
| sm | 8px | --space-sm |
| md | 16px | --space-md |
| lg | 24px | --space-lg |
| xl | 32px | --space-xl |
| 2xl | 48px | --space-2xl |

## 🔲 Border Radius

| Name | Value | Usage |
|------|-------|-------|
| sm | 8px | Inputs, small buttons |
| md | 12px | Cards, panels |
| lg | 16px | Large cards, modals |
| xl | 24px | Buttons, badges |
| full | 9999px | Avatars, pills |

## 🌫️ Shadows

| Name | Value | Usage |
|------|-------|-------|
| sm | `0 2px 4px rgba(0,0,0,0.2)` | Subtle |
| md | `0 4px 12px rgba(0,0,0,0.3)` | Cards |
| lg | `0 8px 24px rgba(0,0,0,0.4)` | Modals |
| glow-green | `0 0 20px rgba(16,185,129,0.3)` | Active studying |
| glow-red | `0 0 20px rgba(244,67,54,0.4)` | Warning alert |

## 📱 Breakpoints

| Name | Width | Design |
|------|-------|--------|
| mobile | < 768px | Primary (mobile-first) |
| tablet | 768px-1024px | 2-column layout |
| desktop | > 1024px | Full dashboard |

## ✨ Animations

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| fast | 150ms | ease-out | Hovers, toggles |
| normal | 300ms | ease-in-out | Transitions |
| slow | 500ms | ease-in-out | Page transitions |
| pulse | 2s infinite | ease-in-out | Warning border |
| blink | 1s infinite | step-end | Red alert |

## 🖼️ Key Component Specs

### Status Badge
```css
.status-badge {
    padding: 6px 16px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 600;
}
.status-studying { background: rgba(16,185,129,0.15); color: #10b981; }
.status-distracted { background: rgba(255,193,7,0.15); color: #FFC107; }
.status-not-studying { background: rgba(244,67,54,0.15); color: #F44336; }
```

### Student Card (Dashboard)
```css
.student-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 20px;
    transition: all 300ms ease;
}
.student-card:hover {
    border-color: #10b981;
    box-shadow: 0 0 20px rgba(16,185,129,0.1);
}
```

### Alert Overlay (Warning)
```css
.alert-overlay {
    position: fixed;
    inset: 0;
    border: 4px solid #F44336;
    border-radius: 0;
    animation: pulse-red 1s infinite;
    pointer-events: none;
    z-index: 1000;
}
@keyframes pulse-red {
    0%, 100% { border-color: #F44336; box-shadow: inset 0 0 30px rgba(244,67,54,0.2); }
    50% { border-color: transparent; box-shadow: none; }
}
```

### Focus Progress Bar
```css
.focus-bar {
    height: 8px;
    border-radius: 4px;
    background: #334155;
    overflow: hidden;
}
.focus-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 1s ease;
}
.focus-bar-fill.good { background: linear-gradient(90deg, #10b981, #34d399); }
.focus-bar-fill.warning { background: linear-gradient(90deg, #FFC107, #FFCA28); }
.focus-bar-fill.danger { background: linear-gradient(90deg, #F44336, #EF5350); }
```

### Primary Button
```css
.btn-primary {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    border-radius: 16px;
    padding: 16px 32px;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 300ms ease;
    box-shadow: 0 4px 12px rgba(16,185,129,0.3);
}
.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16,185,129,0.4);
}
```
