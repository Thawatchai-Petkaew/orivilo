# Intent-driven Adaptive Design System — Project Handoff

> เอกสารส่งต่อให้ AI / ทีม Dev เพื่อเริ่ม Project จากบริบทการสนทนา
>
> วันที่รวบรวม: 21 ตุลาคม 2026 · ภาษาอธิบาย: ไทย · ชื่อและโค้ด: English
>
> สถานะ: Concept + Working architecture + Proposed MVP ยังไม่ใช่ Production specification ที่ผ่านการทดสอบทั้งหมด

## 0. วิธีใช้เอกสารนี้

อ่านทั้งไฟล์ก่อนออกแบบหรือเขียนโค้ด ใช้เป็นบริบทตั้งต้นและรายการตัดสินใจ ไม่ต้องถามผู้ใช้ซ้ำในเรื่องที่ระบุไว้ชัดแล้ว หากเข้าทำงานใน Repository ที่มีอยู่ ให้ตรวจ AGENTS.md, package.json, โครงสร้างโปรเจกต์ และ Components ที่มี ก่อนเสนอ Stack หรือสร้างของซ้ำ

เอกสารนี้เป็นการสังเคราะห์สาระจากบทสนทนาที่มองเห็น ไม่ใช่ Export ประวัติแชททุกข้อความแบบคำต่อคำ เก็บเจตนาผู้ใช้ แนวคิดสำคัญ ข้อเสนอ Architecture ตัวอย่าง และข้อแก้ไขจากคำอธิบายก่อนหน้าไว้ด้วยกัน โดยตัดข้อความซ้ำและข้อมูลส่วนตัวที่ไม่เกี่ยวกับ Project ออก

### คำสั่งเริ่มต้นสำหรับ AI ที่รับไฟล์นี้

คุณคือ Product designer และ Frontend engineer ที่กำลังสร้าง Design System สำหรับการทำงานร่วมกับ AI ให้เริ่มจาก vertical slice ที่ใช้งานได้จริง: Brand input → Intent / Context → Direction previews → Approved profile → Shared components → Inspect / export

ให้ทำงานต่อจนได้ Prototype ที่ทดลองได้ พร้อมอธิบายสิ่งที่ทำได้จริงและสิ่งที่ยังจำลองอยู่ อย่าอ้างว่า AI backend, Token sync, Figma sync หรือ Accessibility checks ทำงานแล้ว หากยังไม่มี Implementation และหลักฐานทดสอบ

หากยังไม่มี Repository และไม่ได้รับข้อกำหนดอื่น ใช้ React + TypeScript + Vite + Tailwind CSS + shadcn/ui เป็น Default สำหรับเริ่มทดลอง ตรวจเอกสารและเวอร์ชันปัจจุบันก่อนติดตั้ง แล้ว Pin เวอร์ชันที่ใช้งานจริง

## 1. Executive concept

สร้าง Design System ของเราเองที่ใช้ Components ชุดเดียว แต่สามารถเปลี่ยนการแสดงออกตาม Brand CI, Visual intent และ Product context โดยควบคุมผ่าน Tokens, Recipes และ Profiles

ผู้ใช้บอกว่า “กำลังสร้างอะไร ใครใช้ และอยากให้ผู้ใช้รู้สึกอย่างไร” ระบบช่วยตีความ เสนอ Visual directions ให้ดู แล้วแปลง Direction ที่ยืนยันเป็น Configuration ที่ให้ผลซ้ำได้

ตัวอย่าง Input:

> เครื่องมือทำงานร่วมกันสำหรับทีมเล็ก อยากให้เป็นมิตร สนุก เริ่มง่าย แต่ยังดูเป็นระเบียบ สีหลักของแบรนด์ล็อกไว้ และไม่อยากให้มี Gradient

ตัวอย่าง Output:

- Product design profile ที่มีบริบท เป้าหมาย และข้อจำกัด
- Visual decisions เช่น soft shape, comfortable density, neutral surfaces
- Brand palette และ Semantic token mapping ที่ผ่านการตรวจ
- Pattern / Component selection ที่เหมาะกับงาน
- Graphic / Motion / Content rules
- Preview ที่ทดลองได้ และ Snapshot ที่มี Version

ชื่อทำงานที่ใช้ระหว่างสนทนา: **Intent Studio**

ชื่ออธิบายแนวคิด: **Intent-driven Adaptive Design System** เป็นคำที่ใช้เรียกแนวคิดของ Project ไม่ใช่มาตรฐานอุตสาหกรรมที่อ้างว่ามีนิยามตายตัว

## 2. เจตนาและความต้องการของผู้ใช้

1. ต้องการ Design System ของตัวเอง ไม่จำกัดแค่เลือก Theme สำเร็จรูป
2. ผู้ใช้ปลายทางระบุ Brand CI และ Mood ของ Product เองได้
3. AI ช่วยกรอง Requirement และตีความ Mood เช่น friendly, formal, minimal, trustworthy
4. Component ตั้งต้นถูกปรับ Look & Feel ผ่านระบบกลาง โดยไม่สร้าง FriendlyButton / FormalButton แยกชุด
5. เน้นฝั่ง Dev และการ Vibe code; Figma เป็นปลายทางที่ควรสอดคล้องในภายหลัง ไม่ใช่จุดเริ่มต้นบังคับ
6. ต้องช่วยให้ AI รู้ว่าควรใช้ Component หรือ Pattern ไหน และใช้อย่างไร
7. ต้องลด UI ที่หน้าตาซ้ำแบบ generic AI output ผ่าน Design direction, Composition, Content และ Review
8. ต้องเห็นผลผ่าน Interactive UX ไม่ใช่มีแต่แผนผังหรือบทความ
9. Mood ต้องเปลี่ยนภาพรวมจริง ทั้ง Graphics, Typography, Density, Surface และ Composition ตามขอบเขตที่รองรับ
10. ต้องแปลง Brand / Product reference เป็นนิยามที่นำไป Map เป็น Code ได้

### สถานะการตัดสินใจ

| เรื่อง | สถานะ |
| --- | --- |
| สร้าง DS ของเราเอง + Intent layer | เป้าหมายผู้ใช้ชัดเจน |
| โฟกัส Dev มากกว่า Figma | ผู้ใช้ระบุชัดเจน |
| ใช้ shadcn + Tailwind เป็นฐาน | Working recommendation จากการสนทนา ไม่ใช่การเลือกเวอร์ชันหรือ Base library ขั้นสุดท้าย |
| ใช้ Untitled UI เป็น Reference | ข้อเสนอด้าน Token roles, Components และความครบของระบบ |
| ให้คนเลือกและยืนยัน Direction | Workflow ที่เสนอสำหรับ MVP |
| ชื่อ Intent Studio | ชื่อชั่วคราว เปลี่ยนได้ |
| ให้บริการภายนอก / ขาย / ใช้ภายในบริษัท | ยังไม่ระบุขั้นสุดท้าย; กระทบสิทธิ์ Assets และการออกแบบ Export |

## 3. ปัญหาที่ต้องแก้

การบอก AI เพียงว่า “ทำให้เป็นมิตรและน่าเชื่อถือ” เปิดพื้นที่ตัดสินใจกว้างเกินไป AI อาจกลับไปใช้รูปแบบคุ้นเคย เช่น Card แบบเดียวทุกหน้า Gradient เดิม หรือปรับสีแต่ไม่ปรับการสื่อสาร

การให้ AI แก้ Raw CSS ของทุก Component โดยตรงทำให้ระบบค่อย ๆ กระจัดกระจาย เช่น Radius ไม่สัมพันธ์กัน Hover แตกต่างกัน และไม่มีเหตุผลว่าค่าไหนมาจากไหน

ทางแก้คือให้ AI ทำงานภายใน Design grammar ที่มีขอบเขต โดยเลือก Patterns และ Profiles จาก Requirement ที่มีโครงสร้าง และให้ Resolver แปลงเป็นค่าที่ตรวจสอบได้

## 4. หลักการที่ต้องรักษา

- **Task chooses UX; Brand and Intent shape expression.** งานกำหนด Pattern/Behavior ส่วน Brand/Intent กำหนดการแสดงออก
- Intent เป็น Configuration / Control layer ไม่จำเป็นต้องนับเป็น Design token อีกชั้น
- Headless primitive หมายถึงฐาน Behavior ต่างจาก Primitive token ที่เป็นคลังค่าพื้นฐาน
- Tokens เปลี่ยนสี ระยะ รูปทรง และคุณสมบัติการแสดงผล แต่ไม่สร้าง Information architecture หรือ Business logic เอง
- Graphic treatment, Content tone และ Interaction behavior ต้องมีระบบของตัวเอง ไม่ยัดทุกอย่างเป็น CSS variables
- Friendly ไม่ได้แปลว่า Radius ใหญ่เสมอ ต้องพิจารณางานและอุปกรณ์
- Trust เป็นเป้าหมายที่ต้องตรวจจากข้อมูล ความชัดเจน หลักฐาน และการใช้งาน ไม่ใช่คะแนนที่เพิ่ม Contrast แล้วรับประกันได้
- Brand, Mode, Density และ Mood เป็นคนละมิติ อย่ารวมเป็นชื่อ Theme เดียวทุก Combination
- Hard constraints ต้องตรวจสอบได้ หากขัดกันให้รายงาน Conflict ไม่เปลี่ยนค่าหรือเดาเงียบ ๆ
- AI ใช้ระบบของทีมผ่าน Public API; การแก้ระบบกลางต้องเป็นการเปลี่ยนที่มี Scope และ Review
- ไม่รับประกันว่าจะรองรับ Digital product ทุกชนิดตั้งแต่แรก สร้าง Schema และ Extension points แล้วขยายจากงานจริง

## 5. Product Design Profile: 6 กลุ่มข้อมูล

| กลุ่ม | ข้อมูลที่รับ | ส่งผลต่อ | Output |
| --- | --- | --- | --- |
| Brand identity / CI | สี Font Logo ภาษาภาพ ข้อห้าม และสิ่งที่ล็อก | ตัวตนและขอบเขตการปรับ | Brand pack + Assets + Palette |
| Visual intent | อารมณ์ที่ต้องการ/หลีกเลี่ยงและตัวอย่าง | Emphasis, Shape, Surface, Graphics, Motion | Visual decisions + Recipes |
| Product context | ผู้ใช้ งาน เป้าหมาย ความซับซ้อนและความเสี่ยง | IA, Priority, Composition | Pattern selection |
| Platform & constraints | Web/Mobile, Input, ภาษา, Accessibility | Responsive, Behavior และ Validation | Constraint set |
| Interaction & patterns | Flow, States, Actions และ Recovery | การประกอบ UI และ State transitions | Pattern / Behavior contracts |
| Content & data | ชนิดข้อมูล แหล่งที่มา ความยาว รูปแบบและความสด | Hierarchy, Formatting และ Empty/Error states | Data / Content contracts |

Brand CI เป็นหนึ่งส่วนของ Product Design Profile ไม่ใช่ตัวแทนของทุกส่วน

## 6. Architecture ที่แนะนำ

### 6.1 Intent control plane

Requirement + Brand pack + Product context + Constraints → Interpreter → Candidate directions → Human selection → Resolver → Validation → Versioned profile

### 6.2 Style system

Primitive tokens → Semantic tokens → Component tokens เมื่อจำเป็น → Recipes / Variants / States → Components

### 6.3 Behavior foundation

Native HTML + Headless primitives → Components

Behavior foundation ทำงานคู่กับ Style system ที่ Components ไม่ต้องถูกแปลงผ่าน Tokens หรือ Intent

### 6.4 Product composition

Task model + Pattern catalog + Components + Data + Content rules → Product UI

### 6.5 Graphics และ Motion

Approved asset packs + Graphic recipes + Motion recipes → Visual expression ในตำแหน่งที่เหมาะสม

### 6.6 Runtime

โหลด Approved profile ที่บันทึกไว้ → Theme boundary / CSS variables → Components และ Patterns

ไม่ต้องเรียก LLM ทุกครั้งที่ผู้ใช้กดปุ่ม การตีความและการแสดงผลเป็นคนละวงจร

## 7. Technology foundation และหน้าที่

| ส่วน | Default ที่เสนอ | หมายเหตุ |
| --- | --- | --- |
| UI framework | React + TypeScript | ตรวจของเดิมก่อนเริ่ม |
| Prototype app | Vite | ไม่บังคับเปลี่ยนจาก Framework ที่ Repository มีอยู่ |
| Component source | shadcn/ui | Copy Source เข้ามาแล้วปรับเข้า Contract ของเรา |
| Styling | Tailwind CSS + CSS variables | Tailwind เป็นเครื่องมือ Styling ไม่ใช่ Intent engine |
| Behavior | Native HTML + Base library ที่เลือก | ตรวจว่า shadcn preset ใช้ฐานใดและใช้ API ให้ตรง ห้ามผสม API จากคนละฐาน |
| Tokens | JSON / TypeScript definitions ที่ตรวจ Schema ได้ | เลือก Source of truth เดียว |
| Token build | Compiler / Generator ขนาดเล็กก่อน | เพิ่มเครื่องมือใหญ่เมื่อมีเหตุผล; จัด Schema ให้ขยายเข้ามาตรฐานได้ |
| Recipes | แนวทางเดิมของ Components หรือ CVA หากเหมาะกับ Source | ไม่ต้องเปลี่ยนเครื่องมือโดยไม่มีเหตุผล |
| Component documentation | Catalog + Examples; Storybook เป็นตัวเลือก | Catalog ที่ AI อ่านได้จำเป็นกว่า Screenshot อย่างเดียว |
| Intent interpretation | Rule-based adapter สำหรับ Demo; LLM adapter ภายหลัง | แสดงสถานะจำลองตามจริง |
| Runtime profile | Theme boundary + Versioned configuration | รองรับ Scope และ Portals อย่างชัดเจน |

### เหตุผลที่ shadcn เป็น Working recommendation

- ควบคุม Source ของ Components ได้
- ปรับทุกตัวเข้า Semantic contract และ Recipes ของเราได้
- เหมาะกับ Catalog / Registry และการให้ AI อ่านโค้ดจริง
- แลกกับความรับผิดชอบดูแลการปรับแต่ง Dependencies และการรวมอัปเดตเอง
- shadcn ไม่ทำให้ AI เลือก Component ถูกเอง ต้องมี Usage rules และ Examples เพิ่ม

### บทบาทของ Untitled UI

ใช้เป็น Reference ด้าน Color roles, State completeness, Components และความสอดคล้องของ Design/Code ไม่ใช่สมมุติว่าซื้อแล้วได้ Intent engine หรือสิทธิ์สร้าง Builder แจกต่อทุกกรณี

## 8. ทางเลือกที่เคยเปรียบเทียบ

ตารางนี้เป็นการสรุปการวิเคราะห์ในบทสนทนา ไม่ใช่ Benchmark เชิงประสิทธิภาพ

| ตัวเลือก | จุดแข็งที่เกี่ยวกับ Project | ต้นทุน / ข้อจำกัดที่ต้องตรวจ |
| --- | --- | --- |
| Untitled UI React | Source ตั้งต้นพร้อม Visual roles และ Components | การดูแลโค้ดที่ปรับ และสิทธิ์ PRO หากนำไปทำ Library/Builder |
| shadcn/ui | เป็นเจ้าของโค้ดและทำ Registry ของเราได้ | ต้องทำ Token contract, Governance และ Maintenance |
| Park UI | แนวทาง Ark UI + Panda CSS เหมาะกับ Tokens/Recipes | ต้นทุนเรียนรู้ Styling stack และการย้ายจาก Tailwind |
| HeroUI | React Aria + Tailwind พร้อม Styled components | การปรับขึ้นกับ API/Slots และการอัปเดต Library |
| Mantine | Theme object, CSS variables และ Styles API | Adapter เข้า Semantic contract ของเรา |
| MUI | Theme/Palette และ Component overrides | งานปรับเมื่อ Visual language ห่างจาก Material มาก |
| Ant Design | Seed → Map → Alias และ Component tokens | ต้องเข้าใจ Derivation และขอบเขต Override |

หากทำ Product บน Ant อยู่แล้ว ไม่จำเป็นต้องย้ายฐานโดยอัตโนมัติ สามารถทำ Adapter จาก Profile เดียวกันไปยัง Ant theme ได้

## 9. Token architecture ของเรา

### 9.1 Primitive tokens

เก็บชุดค่าที่อนุญาต เช่น Color scales, Spacing, Font sizes, Radius, Elevation, Duration และ Sizing

```json
{
  "palette": {
    "neutral": { "0": "#ffffff", "900": "#242420" },
    "rose": { "700": "#bd1743" }
  },
  "radius": { "sm": "6px", "md": "12px", "lg": "16px" },
  "space": { "2": "8px", "3": "12px", "4": "16px", "6": "24px" },
  "duration": { "fast": "120ms", "normal": "160ms" }
}
```

นี่เป็น Fragment จำลอง ไม่ใช่ Palette หรือ Scale ที่ครบพร้อม Production และไม่ใช่ค่าจริงของ Brand ที่ใช้เป็นกรณีศึกษา

### 9.2 Semantic tokens

ตั้งชื่อตามหน้าที่และกำหนดคู่ใช้งาน เช่น:

- Color: `surface.default`, `surface.subtle`, `surface.overlay`
- Text: `text.primary`, `text.secondary`, `text.onAction`
- Action: `action.primary`, `action.primaryHover`, `action.disabled`
- Border: `border.default`, `border.strong`, `border.invalid`
- Selection: `selection.surface`, `selection.foreground`, `selection.border`
- Focus: `focus.ring`, `focus.offset`
- Feedback: `feedback.success.*`, `feedback.warning.*`, `feedback.error.*`
- Shape: `shape.control.radius`, `shape.container.radius`, `shape.media.radius`
- Density: `size.control.minHeight`, `space.control.inline`, `space.row.block`
- Typography: `type.body`, `type.label`, `type.heading`, `type.price`
- Motion: `motion.feedback.duration`, `motion.overlay.duration`

แยก Brand accent, Error, Selection และ Focus เพราะแต่ละอย่างสื่อความหมายต่างกัน ห้ามใช้สีเดียวแล้วให้ผู้ใช้เดาความหมายจากสีล้วน

### 9.3 Component tokens

สร้างเมื่อ Component ต้องควบคุมเฉพาะส่วน เช่น `answerChoice.selected.background`, `listing.media.radius`, `calendar.range.surface`

ไม่ต้องสร้าง Token สำเนาสำหรับทุก Property หาก Recipe ใช้ Semantic token ได้ตรงอยู่แล้ว

### 9.4 Recipes

Recipe กำหนดว่า Base, Variant, Size, State และ Slot ใช้ Token หรือ Rule ไหน

ตัวอย่าง `Button.primary`:

- Background → `action.primary`
- Foreground → `text.onAction`
- Hover → `action.primaryHover`
- Radius → `shape.control.radius`
- Min height → `size.control.minHeight`
- Focus → `focus.ring`

### 9.5 สิ่งที่ไม่ควรยัดเป็น Tokens อย่างเดียว

- การเลือก List, Board, Guided flow หรือ Checkout structure
- ความถูกต้องของข้อมูลและการคำนวณราคา
- Permission, Availability และ Business states
- Tone of voice และเหตุผลที่ต้องแสดงข้อความ
- การเลือก Asset, Graphic composition และ Image crop strategy
- การสร้างความน่าเชื่อถือหรือความสนุกที่ต้องประเมินจากประสบการณ์จริง

## 10. บทเรียนจาก Color structure ของ Untitled UI

โครงสร้างที่ตรวจจากเอกสาร React ระหว่างการสนทนาแยก Raw palettes, Utility colors, Role colors และ Component-specific colors โดยมี Light/Dark remapping

| กลุ่ม | ตัวอย่างชื่อที่พบในเอกสาร | บทเรียนสำหรับระบบเรา |
| --- | --- | --- |
| Brand scale | `--color-brand-600` | รับ CI แล้วต้องมีเฉดสำหรับหน้าที่ต่าง ๆ ไม่ใช่สีเดียว |
| Text | `--color-text-primary` | แยก Hierarchy และบริบทข้อความ |
| Foreground | `--color-fg-primary` | Icon/Foreground อาจต้องควบคุมต่างจาก Text |
| Background | `--color-bg-primary` | พื้นหลักไม่ใช่ Brand primary เสมอ |
| Border | `--color-border-primary` | ขอบมีระดับ Emphasis ของตัวเอง |
| Utility | `--color-utility-brand-50` | สีที่ใช้ข้ามองค์ประกอบต้องเข้าใจ Mode mapping |
| Component-specific | `--color-slider-handle-bg` | ใช้เมื่อ Role กลางไม่พอ |

มี Adapter เข้ากับ CSS properties/Tailwind utilities อีกส่วน ซึ่งเป็น Implementation layer ไม่ใช่ Design decision ใหม่

อย่าสมมุติว่าทุก Component token ของ Reference ต้องผ่าน Semantic alias เสมอ ตรวจ Source ที่ใช้จริงหากต้องการ Strict layering

Light/Dark ไม่ใช่การกลับเลขเฉดทุกตัว บางสีคงเดิม บางสีเปลี่ยนตามหน้าที่ ต้องตรวจคู่สีจริงทุก Mode

สำหรับระบบเราให้แยก Color Profile เป็นอย่างน้อย:

1. Brand palette ที่ล็อก/ปรับได้
2. Surfaces และ Text pairs
3. Action และ State pairs
4. Selection / Focus
5. Feedback semantics
6. Graphic / Chart palette ที่แยกจาก Transaction colors

## 11. Brand CI ที่ผู้ใช้กำหนดเอง

### Input

- Brand name, Logo, Primary/Secondary colors
- Typeface หรือ Font pack ที่ใช้งานได้ตามสิทธิ์ พร้อม Fallback และภาษาที่ต้องรองรับ
- Existing palette ถ้ามี และค่าสีใดต้องตรงเดิม
- Allowed/forbidden treatments เช่น Gradient, Shadow, Illustration
- Desired feelings และ Avoided feelings เป็นคนละช่อง
- Surface / Audience / Task / Platform

### Locked versus adjustable

| สิ่งที่ล็อกได้ | สิ่งที่อาจปรับได้ |
| --- | --- |
| Logo และสี Identity | Action shade ที่เหมาะกับคู่สี หาก Brand อนุญาต |
| Typeface ที่อนุมัติ | Size, Weight, Line height ใน Scale |
| ข้อห้ามการใช้สีและภาพ | ปริมาณการใช้ Brand accent |
| Core accessibility requirements | Density ภายในขอบเขต Platform |
| Feedback meanings | Radius, Elevation และ Motion ที่ตรวจแล้ว |

CI สีเดียวไม่พอสำหรับ UI ทั้งระบบ ต้องสร้างหรือรับชุดเฉดและตรวจ Background/Foreground, Hover/Pressed/Disabled/Focus ให้ครบ หากล็อกทุกอย่างจนขัดกัน ให้รายงาน Conflict พร้อมทางเลือก ไม่เปลี่ยนสีแบรนด์เงียบ ๆ

## 12. Intent interpretation และ Resolver

### 12.1 เริ่มจาก Vocabulary ที่เล็กและแยกความหมายได้

ตัวอย่าง Decisions ที่รองรับ: shape, density, surfaceTreatment, emphasis, graphicExpression, motionExpression

Intent words เช่น friendly, formal, calm, playful เป็นเป้าหมายของผู้ใช้ ส่วน Decisions เป็นภาษาที่ระบบนำไป Implement ได้

อย่าเริ่มด้วยแกน 30 ตัว หรือให้คะแนน Trust/Modernity เป็นตัวเลขที่ดูเหมือนผ่านการพิสูจน์แล้ว Numeric sliders ใช้เป็นค่าควบคุมภายในได้ แต่ต้องอธิบายความหมาย

### 12.2 หน้าที่ AI

- Extract Requirement, Context, Locked values และ Avoided traits
- แยกคำปฏิเสธ เช่น “ไม่อยากให้สนุกเกินไป” ออกจาก “อยากให้สนุกมาก”
- คืน Structured output ที่ตรวจ Schema ได้ พร้อมเหตุผลและสิ่งที่ไม่แน่ใจ
- เสนอ Direction ที่สัมพันธ์กับ Product และ Assets ที่มี
- ไม่สร้าง Confidence percentage ที่ไม่มีวิธีประเมิน
- ไม่เดาชื่อ Props, Tokens, Imports หรือ Component ที่ไม่มีจริง

### 12.3 หน้าที่ Resolver

```ts
resolveProfile({ intent, brand, context, constraints, catalogVersion })
// returns:
// decisions + resolvedTokens + recipeIds + patternIds
// + adjustments + conflicts + validationReport
```

เริ่มจากการเลือก Curated profiles และ Override เฉพาะสิ่งที่รองรับ ก่อนทำ Continuous generation ที่ซับซ้อน

- Input เดิม + Resolver/catalog version เดิม → ผลการ Resolve เดิม
- Timestamp และ Approval metadata ไม่รวมในผลเชิง Design ที่ต้องเปรียบเทียบซ้ำ
- ตรวจ References, Modes, Required pairs และค่าที่ระบบรองรับ
- หาก Constraint เข้ากันไม่ได้ ให้คืน Conflict แทนการละเมิดข้อใดข้อหนึ่ง
- ถ้ามี Adjustment ให้เก็บ Source intent เดิม ค่า Output และเหตุผล
- Accessibility เป็น Constraint ที่ต้องตรวจทั้ง Token pair และ UI จริง; ไม่ใช่แค่มี Boolean ว่า accessible=true

### 12.4 ตัวอย่างกฎจำลอง

| Input | Decision ที่อาจเลือก | เงื่อนไข |
| --- | --- | --- |
| Friendly + Touch onboarding | Soft shape + Comfortable controls | อยู่ใน Scale และเหมาะกับ Input |
| Focused + Dense work queue | Neutral surfaces + Compact rows | ไม่ลดพื้นที่กด/การอ่านต่ำกว่าข้อกำหนด |
| Expressive + Completion moment | Celebration recipe | Trigger จากผลสำเร็จจริงและรองรับ reduced motion |
| Minimal + Important transaction | ลด Decoration แต่คงข้อมูลสำคัญ | ห้ามซ่อนราคา เงื่อนไข Focus หรือ Error |

## 13. Configuration schema ตัวอย่าง

เป็นข้อเสนอตั้งต้น ควร Implement Schema validation และ Migration แยก ไม่ถือว่า JSON นี้ครบทุก Case

```json
{
  "schemaVersion": "1.0",
  "profileId": "travel-welcoming",
  "profileVersion": 1,
  "resolverVersion": "rules-1",
  "catalogVersion": "catalog-1",
  "status": "draft",
  "brand": {
    "id": "demo-brand",
    "version": 1,
    "paletteId": "approved-rose",
    "typographyId": "approved-thai-latin",
    "lockedFields": ["logo", "identityColor"],
    "allowedTreatments": ["flat", "subtle-depth"]
  },
  "context": {
    "productType": "stay-marketplace",
    "surface": "search-results",
    "platform": "responsive-web",
    "inputMethods": ["touch", "keyboard", "pointer"],
    "locales": ["th-TH", "en-US"]
  },
  "sourceIntent": {
    "desired": ["welcoming", "calm", "discovery"],
    "avoided": ["constant-promotion"],
    "rationale": "ให้สถานที่เด่นและช่วยเปรียบเทียบได้"
  },
  "decisions": {
    "shape": "soft",
    "density": "comfortable",
    "surfaceTreatment": "neutral",
    "imagery": "place-first",
    "brandExpression": "selective",
    "motion": "functional"
  },
  "semanticTokenSetId": "travel-welcoming-v1",
  "supportedModes": ["light", "dark"],
  "patternIds": ["stay-search", "stay-list-map"],
  "graphicRecipeIds": ["place-photography"],
  "contentRuleSetId": "clear-travel-copy",
  "adjustments": [],
  "conflicts": [],
  "validation": { "status": "not-run", "checks": [] },
  "approval": null
}
```

คำว่า supportedModes เป็นข้อกำหนดที่ต้องทำให้ครบ ไม่ใช่ประกาศรองรับแล้วมีแค่ Light token set

Approved snapshot ต้องผูกกับ Input, Versions, Resolved values และผลตรวจที่ใช้อนุมัติ แก้ค่าแล้วสร้าง Draft ใหม่ ไม่เปลี่ยน Snapshot เก่าเงียบ ๆ

## 14. Component contract และความสอดคล้องกับ Figma

เริ่ม Code-first แต่กำหนด Naming/Variants/States ให้ Figma ใช้ตรงกันภายหลัง

```ts
type ButtonProps = {
  variant: "primary" | "secondary" | "ghost" | "destructive";
  size: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
};
```

เป็น API ของ DS ที่เราเสนอ ไม่ใช่คำรับรองว่า shadcn preset ทุกตัวใช้ชื่อ Variant นี้ ให้ทำ Adapter/Recipe ให้ตรงกับ Source ที่เลือก

- Figma properties ควรตรงกับ Code contract
- Hover/Focus เป็น Interaction state ไม่จำเป็นต้องเปิดเป็น Public prop ทุกตัว
- Loading ต้องมี Behavior เช่นป้องกัน Action ซ้ำและสื่อสถานะ ไม่ใช่แค่ Spinner
- Icon-only buttons ต้องมี Accessible name
- Token values สามารถ Generate เข้าสองฝั่งจาก Source เดียว แต่ Component structure/Behavior ต้องตรวจเพิ่ม
- Code Connect หรือการ Export tokens ไม่ได้ทำให้ Design กับ Code ตรงกันอัตโนมัติทั้งหมด

## 15. ให้ AI เลือก Components อย่างไร

### ลำดับข้อมูลที่ Agent ต้องใช้

1. Requirement / User task / Data / Constraints
2. Pattern และ Component catalog ของทีม
3. API / Imports / Examples ของรายการที่เลือก
4. Approved profile + Tokens + Content/Graphic rules
5. เอกสารฐาน shadcn, Headless และ Tailwind เมื่อจำเป็น

### กฎเลือกตัวอย่าง

| งาน | ตัวเลือกตั้งต้น | ต้องตรวจเพิ่ม |
| --- | --- | --- |
| เลือกหนึ่งรายการสั้นที่ควรเห็นทุกตัวเลือก | RadioGroup | จำนวนตัวเลือกและพื้นที่ |
| เลือกหนึ่งรายการยาวและต้องค้นหา | Combobox | Async data, Empty, Keyboard |
| เปิด/ปิดการตั้งค่าที่มีผลทันที | Switch | การบันทึกและ Error recovery |
| ยืนยันการลบ | ConfirmDeleteDialog ของเรา | Impact, Pending, Failure |
| ส่งเอกสารหลายประเภท | DocumentChecklist ของเรา | Required items, Status, Retry |

Pattern ที่มีอยู่แล้วควรมีลำดับก่อนการประกอบ Base components ใหม่ แต่ต้องตรวจว่างานตรงกันจริง ไม่บังคับใช้ Pattern ผิดเพียงเพราะชื่อใกล้กัน

### Catalog entry ตัวอย่าง

```yaml
name: StayListingCard
status: stable
import: "@/design-system/patterns/stay-listing-card"
useWhen:
  - แสดงที่พักในผลค้นหา
avoidWhen:
  - สรุปค่าใช้จ่ายก่อนชำระเงิน
contract: "StayListingSummary"
variants: [default, compact]
states: [default, selected, loading, unavailable]
examples:
  - "@/examples/stay-search-results.tsx"
rules:
  - Save action ไม่ชนกับการเปิดรายละเอียด
  - ราคาและคำอธิบายยึด Data contract
  - ไม่สร้าง Rating หรือ Trust badge หากไม่มีข้อมูล
```

ตัวอย่างนี้เป็น Metadata ของ Catalog ไม่ใช่ Component code ที่มีอยู่แล้ว

### Agent workflow

Read project rules → Search catalog → Read relevant contracts/examples → Select patterns/profile → Compose UI → Validate states/behavior/style → Report gaps

โหลดเฉพาะเอกสารที่เกี่ยวข้อง ไม่ Inject โค้ดทุก Component หรือประวัติทั้งหมดทุกครั้ง Registry/MCP ช่วยค้นและส่งโค้ด แต่ Usage guidance และ Governance ยังต้องสร้างเอง

## 16. Runtime styling: จุดที่ Profile เข้ามาครอบ

Profile ถูก Resolve และ Validate ก่อน Render แล้ว Apply ที่ root หรือ Scope ของ Product

```tsx
<DesignProfileBoundary profile={approvedProfile}>
  <ProductScreen />
</DesignProfileBoundary>
```

`DesignProfileBoundary` เป็น Component ที่เราต้องสร้าง ไม่ใช่ API สำเร็จรูปของ shadcn

ข้อควร Implement:

- กำหนดชัดว่า Profile ใช้ทั้ง App หรือแค่ Preview subtree
- Scoped CSS variables สำหรับ Preview หลาย Direction ในหน้าเดียว
- ออกแบบ Brand, Mode และ Density ไม่ให้ Cascade ทับกันโดยไม่ตั้งใจ
- ตัวแปรที่อ้างกันต้อง Resolve ใน Scope ถูกต้อง ระวัง Alias ที่ถูกประกาศบน Ancestor แล้วกลายเป็นค่าคงที่ที่ Descendants ไม่ได้รับตามคาด
- Dialog/Popover ที่ Render ผ่าน Portal ต้องรับ Profile เดียวกับจุดเรียก จะใช้ Portal container หรือส่ง Theme context ต้องเลือกให้ชัด
- ไม่ทำให้ทั้งต้นไม้ Remount เมื่อขยับ Style controls จนฟอร์มหาย
- Reduced-motion และ System/user preferences ต้อง Override การตกแต่งที่ไม่จำเป็นได้
- ห้ามสุ่มค่า Style ขณะ Render เพราะต้อง Reproduce ได้

### CSS fragment ตัวอย่าง

เป็น Demo ของ Light profile ไม่ใช่ Theme ที่ครบทุก Token/State

```css
[data-design-profile="travel-welcoming"] {
  --ds-surface-default: #ffffff;
  --ds-text-primary: #242420;
  --ds-action-primary: #bd1743;
  --ds-action-on-primary: #ffffff;

  --ds-control-radius: 12px;
  --ds-media-radius: 16px;
  --ds-control-height: 48px;

  --background: var(--ds-surface-default);
  --foreground: var(--ds-text-primary);
  --primary: var(--ds-action-primary);
  --primary-foreground: var(--ds-action-on-primary);
}

/* Tailwind v4 adapter; align with installed project configuration */
@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
}

.ds-control {
  min-height: var(--ds-control-height);
  border-radius: var(--ds-control-radius);
}
```

ต้องปรับ Recipe ของ Component กลางให้ใช้ค่าพวกนี้จริง ลบหรือเปลี่ยน Fixed classes ที่ขัดกัน ไม่หวังว่าประกาศ Token แล้วทุก Component จะปรับเอง

## 17. UX ของ Intent Studio ที่ต้องสร้าง

### 17.1 Input

- Product name และคำอธิบาย
- Audience, Task และ Surface
- Desired / Avoided feelings
- Brand inputs และ Locked fields
- Platform และภาษาที่รองรับ
- Brief presets ให้ลองทันที

### 17.2 Interpret

แสดงสิ่งที่ระบบเข้าใจ ข้อกำหนดที่พบ และสิ่งที่ยังไม่แน่ใจ ให้แก้ได้ ถ้าเป็น Rule-based demo ให้ระบุชัด ไม่มีการอ้างว่ากำลังใช้ AI จริง

### 17.3 Recommend 2–3 directions

แต่ละ Direction มีชื่อ Mood words, Mini preview, Graphic example และเหตุผล ความต่างต้องมากกว่าสลับสี

เปรียบเทียบด้วย Content และ Task เดียวกันใน Surface เดียวกัน เพื่อแยกผลของ Visual direction ออกจากความต่างของข้อมูล

### 17.4 Live refinement

ตัวควบคุมตัวอย่าง: Shape, Density, Surface depth, Graphic expression, Motion แต่ละอันต้องเปลี่ยน UI จริง แสดงค่าและข้อจำกัดที่ถูกใช้

ไม่ควรเปลี่ยนโครงสร้าง/Task แบบไม่บอกเมื่อขยับ Mood หากเปลี่ยน Pattern ให้เป็นการตัดสินใจอีกขั้นที่เห็นได้

### 17.5 Inspect

Progressive disclosure สำหรับ Intent → Decisions → Tokens → Recipes → Components / Pattern พร้อมแสดงว่าอะไรเปลี่ยน อะไรถูกล็อก และทำไม

### 17.6 Approve / Export

- Draft → Validating → Ready for review → Approved
- Invalid/conflicting state ต้องยังไม่อนุมัติเป็นชุดที่ผ่านแล้ว
- เปลี่ยน Input หลัง Approved → Draft revision ใหม่
- Export JSON ที่มี Version และข้อมูลเพียงพอสำหรับ Reproduce
- Import JSON กลับและ Render ได้เหมือนเดิมภายใต้ Dependencies/Versions เดิม
- หากบันทึกเฉพาะ Session หรือ Local storage ต้องระบุตามจริง

### Visual direction ของตัวเครื่องมือ

ผู้ใช้เคยขอให้ Artifact ตัวเครื่องมือมี Morphism และสีสนุก จึงเสนอ Claymorphism + Glassmorphism อย่างพอดี ใช้ Lavender, Coral, Lime, Sky blue อ่านไทยง่าย และมีลำดับความสำคัญ

Style ของเครื่องมือแยกจาก Preview: เลือก Professional แล้ว Preview ต้องสุขุมได้จริง ไม่ติด Claymorphism ตามเครื่องมือทุกกรณี

กราฟิกสร้างด้วย SVG/CSS หรือ Approved asset pack ได้ ไม่ต้องสร้างภาพด้วย AI ทุกครั้ง และต้องไม่กลบเนื้อหา

## 18. Product reference cases ที่ใช้ Calibration

ทุก Profile ในหัวข้อนี้เป็นการตีความ ไม่ใช่ Design tokens หรือระบบภายในจริงของแบรนด์ ค่า px/สีที่ยกเป็นตัวอย่างก่อนหน้าเป็นค่าจำลอง ไม่ใช่การวัดจาก Brand assets

### 18.1 Shopee — Value-driven discovery commerce

ขอบเขต: ผู้ซื้อ Marketplace ประเทศไทย

| มิติ | การถอดนิยาม | ผลต่อระบบ |
| --- | --- | --- |
| Brand | เข้าถึงง่าย มีพลัง มีสีแบรนด์ชัด | Brand identity แยกจาก Campaign palette |
| Intent | คุ้มค่า ค้นพบสินค้า เปรียบเทียบได้ | Price hierarchy, Product discovery และ Offer visibility |
| Context | ซื้อสินค้าจากหลายร้าน มีตัวเลือกจำนวนมาก | Search, Filters, Product variants, Cart และ Checkout |
| Constraints | ภาษาไทย จอเล็ก ราคา/ส่วนลดที่ต้องมีเงื่อนไข | Localization, Data accuracy และ Responsive |
| Patterns | ProductSearch, ProductOptionSelector, OfferSelector, CheckoutSummary | Domain patterns บน Base components |
| Data | สินค้า รูป ราคา เงื่อนไขร้าน รีวิว ค่าจัดส่งและสถานะ | Contracts แยกหน้าที่และแหล่งข้อมูล |

- Home/Campaign แสดงออกได้สูง; Checkout ต้องลดสิ่งรบกวนและทำยอดชำระให้ชัด
- โฆษณาต้องมี Metadata/Label ตามข้อมูล ไม่ถูก Theme ซ่อน
- Trust ต้องมาจากข้อมูลร้าน รีวิว เงื่อนไข และสถานะ ไม่ใช่ทำสีให้ดู Corporate
- ราคาเดิม/ส่วนลด/Countdown ใช้เมื่อมีข้อมูลจริงเท่านั้น

### 18.2 Duolingo — Encouraging learning

ขอบเขต: การเรียนภาษา ไม่รวม Product อื่นของบริษัทโดยอัตโนมัติ

| มิติ | การถอดนิยาม | ผลต่อระบบ |
| --- | --- | --- |
| Brand | เป็นมิตร มีตัวละครและภาษาภาพชัด | Character / Graphic pack ไม่ใช่แค่ Green theme |
| Intent | กล้าลอง ผิดแล้วเรียนต่อ อยากกลับมา | Encouraging feedback และ Purposeful celebration |
| Context | เรียนทีละโจทย์ มีความคืบหน้าและการฝึกซ้ำ | Guided flow, Lesson runner และ Progress |
| Constraints | หลายภาษา เสียง/การพูด สถานการณ์เรียนต่างกัน | Language support, Audio controls และ Alternatives |
| Patterns | ExerciseRunner, AnswerChoice, AnswerFeedback, StreakSummary | แยก Selected answer ออกจาก Evaluated result |
| Data | โจทย์ คำตอบ คำอธิบาย Progress และผลจริง | การตอบผิดไม่ใช่ System failure |

- Streak และ XP เป็น Product mechanics ไม่ใช่ Tokens
- Motion ใช้เสริมผลสำเร็จจริงและต้องไม่บังโจทย์
- ไม่สรุปว่าทุกหน้าต้องมี Artwork ใหญ่; ความสม่ำเสมอต้องสมดุลกับหน้าที่ของหน้า

### 18.3 Linear — Focused product workspace

ขอบเขต: พื้นที่จัดการงาน ไม่เอาหน้าการตลาดมาครอบ Product ทุกส่วน

| มิติ | การถอดนิยาม | ผลต่อระบบ |
| --- | --- | --- |
| Brand | สุขุม แม่นยำ ใส่ใจรายละเอียด | Restrained visual expression |
| Intent | ทำงานคล่อง สแกนง่าย ควบคุมบริบทได้ | Neutral surfaces, Clear hierarchy, Predictable actions |
| Context | Issues/Projects จำนวนมากและงานร่วมทีม | Work queues, Filters และ Multi-select |
| Constraints | Keyboard/Pointer และข้อมูลหนาแน่น | Focus, Selection, Shortcuts และ Density rules |
| Patterns | WorkQueue, IssueDetail, PropertyPicker, BulkActionBar | Metadata และ Bulk actions มี Contract |
| Data | ชื่องาน สถานะ Priority ผู้รับผิดชอบและ Activity | State model และ Mutation feedback |

- Highlight/focus กับ Bulk selection ต้องแยกกัน
- ความคล่องตัวมาจาก Behavior/Latency/Workflow ไม่ใช่ Theme สีเข้ม
- บทความ Redesign ปี 2024 อธิบายการ Generate theme จาก Base, Accent, Contrast ด้วย LCH เป็น Reference ทางแนวคิด ไม่ถือว่าเป็น Spec ปัจจุบันทั้งหมด

### 18.4 Airbnb — Welcoming travel discovery

ขอบเขต: Guest Homes; Services/Experiences เป็นคนละ Domain extension

| มิติ | การถอดนิยาม | ผลต่อระบบ |
| --- | --- | --- |
| Brand | อบอุ่น เป็นมนุษย์ ให้สถานที่และ Host มีตัวตน | Place-first imagery และ Human tone |
| Intent | ชวนสำรวจ สงบ ชัด และควบคุมการเลือกได้ | Media-led layouts + Clear decision support |
| Context | หาที่พักตามปลายทาง วันที่ และผู้เข้าพัก | Query state เชื่อม Search, Availability และ Quote |
| Constraints | จอเล็ก หลายภาษา ราคาและระดับรายละเอียดตำแหน่ง | Localization, Pricing และ Location visibility rules |
| Patterns | StaySearchBar, StayFilterPanel, StayListingGrid, StayListMapView, ReservationQuote | Map engine และ Domain logic ต้องเพิ่มเอง |
| Data | ภาพ ทำเล Amenities Host Reviews Availability Quote และ Booking state | Confidence มาจากหลักฐานและข้อมูลจริง |

- Explore ให้ภาพนำ; Checkout ให้ราคา เงื่อนไข และสถานะนำ
- Media radius เป็น Token แต่ Image ratio, Crop และ Composition เป็น Recipe/Layout
- ราคาเปลี่ยนตาม Query ต้อง Revalidate; ไม่แต่งข้อมูล Trust/Availability
- Selected Card/Marker ต้องสัมพันธ์กัน แต่ไม่บังคับว่าผลบน Map และ List เหมือนกันทุกกรณี
- รายละเอียดตำแหน่งที่แสดงขึ้นกับ Data/Permissions ไม่ใช่ Mood
- ฐานข้อมูลที่ใช้เก็บพิกัดจริงต้องไม่ส่งลง Client แล้วหวังว่าการวาด Marker คร่าว ๆ จะป้องกันข้อมูลได้

### End-to-end Airbnb-inspired example

Brief: “ค้นหาที่พักครอบครัว เลือกวันและจำนวนผู้เข้าพัก ดูแผนที่ได้ อบอุ่น อ่านง่าย ไม่เน้นโปรโมชั่น”

1. Interpreter แยก `stay-marketplace`, `search-results`, desired/avoided traits
2. Pattern selector เลือก `stay-list-map` จากงาน ไม่ใช่จากสี
3. Resolver เลือก `place-first`, `neutral-surfaces`, `comfortable-controls`, `selective-accent`
4. Token compiler สร้าง Semantic color pairs, Radius, Spacing และ Mode sets
5. Graphic recipe ใช้ภาพสถานที่ ไม่เติม Character เพียงเพราะ Friendly
6. AI ใช้ Catalog/API สร้างหน้าจอ โดยข้อมูลมาจาก Contracts เดียวกัน
7. ตรวจการค้นหา การเชื่อม Marker/Card ราคาและ States
8. คนเลือก/ยืนยัน Profile แล้วบันทึก Snapshot พร้อม Versions

```tsx
<DesignProfileBoundary profile={approvedProfile}>
  <StaySearchBar query={query} onChange={setQuery} />
  <StayListMapView
    listings={results.listings}
    selectedId={selectedId}
    onSelect={setSelectedId}
  />
</DesignProfileBoundary>
```

Components นี้เป็นของที่เราจะต้อง Implement และอธิบายใน Catalog ไม่ใช่ API สำเร็จรูปจาก shadcn

## 19. Proposed MVP

### เป้าหมาย

พิสูจน์ว่า Brand/Intent คนละชุดสามารถครอบ Components และ Pattern เดิม โดยคง Behavior/Data contract และ Reproduce Profile ได้

### ขอบเขตแนะนำ

- หนึ่ง Product surface: Team workspace / Project creation
- หนึ่ง Brand pack ตัวอย่าง พร้อมแก้สีและ Lock ได้
- สอง Profiles ด้วยมือ: Professional กับ Friendly
- Direction ที่สามเพิ่มเมื่อทำให้ต่างอย่างมีเหตุผลและตรวจแล้วได้
- Shared components: Button, Input, Checkbox/Select ตามงาน, Dialog, Card และ Table/list ขนาดเล็ก
- States: Default, Hover, Focus, Disabled, Loading, Empty, Error, Success ตามความเหมาะสม
- แสดงอย่างน้อยหนึ่ง Overlay เพื่อพิสูจน์ Theme scope/Portal
- Live preview พร้อม Task เดิมและข้อมูลตัวอย่างเดิมเมื่อเทียบ Directions
- Inspector, Draft/Approval, Export/Import JSON และ Version
- สาธิตอย่างน้อย Light/Dark ถ้าจะประกาศรองรับ; ถ้าทำ Light-only ให้ระบุใน Scope และ Schema ตามจริง
- Content ภาษาไทยและ Latin พร้อมชื่อยาว / ข้อมูลไม่ครบ
- Rule-based interpretation ที่บอกตามจริง แล้วมี Interface สำหรับ LLM adapter

### ยังไม่จำเป็นในรอบแรก

- Real payment/booking backend, Map integration เต็มรูปแบบ หรือรองรับทุก Product domain
- Figma plugin และ Two-way sync อัตโนมัติ
- LLM เรียกทุก Interaction, Agent swarm หรือระบบบริการหลายองค์กร
- สร้าง Component library ขนาดใหญ่ก่อนพิสูจน์ Vertical slice
- Numeric slop score หรือ Emotion confidence ที่ไม่มีการตรวจสอบ

กรณีศึกษา Shopee/Duolingo/Linear/Airbnb เป็น Calibration references ไม่ใช่ข้อกำหนดให้ Clone ทั้งสี่ Product ใน MVP

## 20. ลำดับการ Build

| Phase | งาน | เกณฑ์จบ |
| --- | --- | --- |
| 1 | Task, Constraints, Semantic contract | มี Schema และ Reference screen ที่ชัด |
| 2 | Primitive palette + สอง Profiles ด้วยมือ | เปลี่ยนชุดค่าแล้วหน้าตาต่างแต่ States ยังครบ |
| 3 | Shared components และ Recipes | ไม่มี Style patch รายหน้าสำหรับเปลี่ยน Mood |
| 4 | หนึ่ง Pattern + หน้าจอจริง | ข้อมูลยาว จอเล็ก Error และ Overlay ทำงาน |
| 5 | Deterministic resolver + Validation | Input เดิมได้ผลเดิม; Conflict ตรวจได้ |
| 6 | Brief interpreter + Directions | ไม่อ้าง AI จริงหากใช้กฎ; Preview สัมพันธ์กับ Input |
| 7 | Approve, Version, Export/Import | Round-trip คืนหน้าตาและ Configuration เดิม |
| 8 | Agent catalog และ Generation exercise | AI ใช้ Public components เดิมโดยไม่สร้างของซ้ำ |

## 21. โครงสร้างโค้ดที่เสนอ

เป็น Logical modules ปรับ Folder ตาม Repository ที่มี ไม่ต้องแยกเป็นหลาย Packages ทันที

| Module | หน้าที่ |
| --- | --- |
| `design-system/tokens/` | Definitions, References, Modes และ Compiler |
| `design-system/brands/` | Brand packs, Assets, Locks และ Versions |
| `design-system/profiles/` | Curated decisions และ Token mappings |
| `design-system/recipes/` | Component/Graphic/Motion recipes |
| `design-system/components/` | Public DS components บนฐาน shadcn |
| `design-system/patterns/` | Task-based composed UI |
| `design-system/catalog/` | Metadata, Usage rules, Contracts และ Examples |
| `intent/` | Input schemas, Interpreter adapters และ Prompt/Rule definitions |
| `resolver/` | Deterministic decisions, Constraints, Conflicts และ Validation |
| `studio/` | Brief form, Direction selector, Preview, Inspector และ Approval |
| `examples/` | Reference screens และ Calibration fixtures |
| `tests/` | Tests ที่ตรวจ Contract/Behavior/Resolve จริง |

## 22. Acceptance criteria และการตรวจที่มีความหมาย

- [ ] User brief ถูกแยกเป็น Brand, Task, Desired และ Avoided traits โดยไม่สลับคำปฏิเสธ
- [ ] มีสอง Directions ที่ต่างจริงบน Task/Content เดียวกัน
- [ ] Control แต่ละตัวเปลี่ยนผลลัพธ์จริง ไม่มี Slider ประดับ
- [ ] เปลี่ยน Brand โดยไม่เปลี่ยน Feedback semantics โดยไม่ตั้งใจ
- [ ] เปลี่ยน Profile แล้ว Component API/Business behavior คงเดิม
- [ ] Inputs/State ของ Preview ไม่หายเพราะเปลี่ยน Style
- [ ] Overlay และ Preview subtree รับ Profile ถูกต้อง
- [ ] Modes ที่ประกาศรองรับมี Tokens และการตรวจครบ
- [ ] Text/Background pairs, Focus, Keyboard และ Zoom ตรวจใน UI จริง
- [ ] State ต่างความหมาย เช่น Selected/Focus, Answer wrong/Network error แยกชัด
- [ ] Locked field conflict ถูกแสดง ไม่แก้เงียบ ๆ
- [ ] Resolver ให้ผล Design ซ้ำได้ภายใต้ Versions เดิม
- [ ] Approved snapshot ไม่ถูกแก้ทับ; การแก้สร้าง Draft revision
- [ ] Export/Import ผ่าน Schema validation และคืนผลเดิม
- [ ] Data ที่มีผลต่อธุรกรรมมาจาก Contract ไม่แต่งให้ UI ดูดี
- [ ] AI เรียก Components/Props ที่มีจริง พร้อม Imports ที่ถูก
- [ ] มีการระบุสิ่งที่เป็น Demo/mock กับสิ่งที่ Implement แล้ว

Tests ที่ควรมี: Resolver determinism/conflicts, Schema round-trip, Interaction states และ Portal scope; ตรวจ Visual regression บน Fixture screens ที่เลือก ไม่เขียน Snapshot ซ้ำ Implementation โดยไม่มีประโยชน์

## 23. กฎสำหรับ AI agent ใน Repository

กฎตัวอย่างสำหรับนำไปปรับเป็น AGENTS.md ภายหลัง:

1. อ่าน Catalog ก่อนประกอบหน้าใหม่ ใช้ Patterns/Components ของทีมเมื่อ Requirement ตรง
2. อ่าน Type signatures และ Example ที่เกี่ยวข้องก่อนใช้ Props
3. ห้ามสร้าง Token name หรือ Public API ที่ไม่มีจริงโดยไม่เพิ่มใน Contract
4. ใช้ Semantic tokens ใน Recipes ไม่เติม Hex/Radius เฉพาะหน้าเพื่อเปลี่ยน Mood
5. Tailwind ใช้ Layout/composition ได้ตามกฎ ไม่ห้ามทุก Utility แบบเหมา
6. ไม่เปลี่ยน Shared component ทั่วระบบเพื่อแก้ Case เดียวโดยไม่ตรวจผลกระทบ
7. ถ้า Component ไม่พอ ให้เสนอ Extend recipe/variant หรือ Pattern พร้อมเหตุผลและ Scope
8. ห้ามใช้ Brand accent แทน Error/Warning/Focus โดยไม่ตรวจความหมาย
9. ห้ามสร้าง Trust badges, Rating, Discount, Countdown หรือ Success state ที่ไม่มีข้อมูลรองรับ
10. Profile เปลี่ยน Visual expression; Business logic, Permissions และ Data validation มาจาก Domain
11. ทำ Visual/Interaction QA ตามงาน แล้วรายงานข้อจำกัดตรงไปตรงมา

## 24. สิ่งที่เคยทำในบทสนทนาและยังต้องระวัง

เคยสร้าง HTML Prototype ชื่อ `design-intent-lab.html` เพื่อทดลองแนวคิด โดยมี Brief input, Mood presets, Sliders, Live workspace preview, ข้อมูล Tokens และแผนผังรอง

สถานะที่อธิบายในบทสนทนา: ใช้กฎจำลอง ไม่ได้เชื่อม AI จริง; มีการตรวจ JavaScript และ DOM interactions แต่การติดตั้ง Browser สำหรับ Visual inspection ในสภาพแวดล้อมขณะนั้นไม่สำเร็จ จึงไม่ควรอ้างว่าผ่าน Browser visual QA จากหลักฐานดังกล่าว

ไฟล์ HTML เดิมไม่ถูกแนบหรือเป็น Dependency ของ Markdown นี้ และไม่ได้อ่านทบทวนเวอร์ชันล่าสุดในการรวบรวมครั้งนี้ หากจะนำมาใช้ ให้ขอไฟล์หรือค้นให้ตรงก่อนวิเคราะห์สถานะปัจจุบัน

Prototype เดิมเป็น Proof of concept ไม่ใช่หลักฐานว่า Export/Import, Deterministic resolver, Production a11y หรือ Figma sync ครบแล้ว

## 25. Reference repositories จากช่วงสำรวจแรก

รายชื่อเหล่านี้เคยถูกกล่าวถึงเป็นแรงบันดาลใจ ไม่ได้ Audit หรือยืนยันรายละเอียดปัจจุบันในเอกสารนี้ ก่อนนำมาใช้ต้องเปิดอ่าน Source, License, Activity และ Feature จริง อย่าอ้างจำนวน Themes หรือ Anti-slop checks ตามคำตอบเดิมโดยไม่ตรวจ

- Superdesign Prompts: https://github.com/superdesigndev/superdesign-prompts
- Hallmark: https://github.com/nutlope/hallmark
- anti-ai-slop-ui: https://github.com/rwcod/anti-ai-slop-ui
- Anti-Slop Library: https://github.com/rohunvora/anti-slop-library
- Registry starter: https://github.com/vercel/registry-starter

แนวคิดที่ต้องการนำมาศึกษา: Style retrieval, การแยก Style จาก Page type, Design directions, Human selection และ Quality gate ไม่ถือว่าโปรเจกต์ข้างต้นมีทุก Feature ตามชื่อ

## 26. Licensing และข้อเท็จจริงที่ต้องตรวจใหม่ตอนเริ่ม

- สร้าง Architecture, Tokens, Catalog และ Components ของเราเองได้โดยใช้แนวคิดทั่วไปเป็น Reference
- หากใช้ Source ของผู้อื่น ให้ตรวจ License ของไฟล์/Package ที่ใช้จริงและรักษา Notices ตามเงื่อนไข
- ส่วน Open-source ของ Untitled UI ที่ระบุ MIT ใช้ตาม MIT; อย่าเหมารวม Assets/PRO ทั้งหมดเป็น MIT
- ในการสนทนาเอกสาร Untitled UI PRO มีข้อจำกัดเรื่องการทำ UI kit, Library หรือ Builder เพื่อแจก/ขาย จึงต้องตรวจเงื่อนไขล่าสุดก่อนนำเข้า Product ที่ Export โค้ดให้ผู้อื่น
- การซื้อ PRO ไม่ได้แปลว่าได้รับสิทธิ์เผยแพร่ต่อทุกแบบ
- อย่านำ Font/Logo/Graphic assets ของ Product references มาทำเป็น Brand pack ของเราโดยสมมุติว่าแจกได้
- ราคา แพ็กเกจ Versions และ Base library options เปลี่ยนได้ จึงไม่ตรึงตัวเลขจากบทสนทนาเป็น Requirement

## 27. Sources สำหรับ AI ตัวถัดไป

ลิงก์เหล่านี้เป็นแหล่งอ้างอิงที่ใช้ระหว่างบทสนทนา ไม่ได้รับประกันว่าเนื้อหายังเหมือนเดิม ณ วันที่เริ่ม Implement ให้ยึดเอกสารและ Source ที่ใช้จริงเป็นหลัก

### ฐาน Dev / Tokens / Agent integration

- shadcn introduction: https://ui.shadcn.com/docs
- shadcn theming: https://ui.shadcn.com/docs/theming
- shadcn skills: https://ui.shadcn.com/docs/skills
- shadcn MCP: https://ui.shadcn.com/docs/mcp
- Tailwind theme variables: https://tailwindcss.com/docs/theme
- Untitled UI React: https://www.untitledui.com/react
- Untitled UI theming: https://www.untitledui.com/react/docs/theming
- Untitled UI dark mode: https://www.untitledui.com/react/docs/dark-mode
- Untitled UI Vite / theme example: https://www.untitledui.com/react/integrations/vite
- Untitled UI source: https://github.com/untitleduico/react
- Untitled UI license: https://www.untitledui.com/license
- Radix primitives: https://www.radix-ui.com/primitives/docs/overview/introduction
- Park UI: https://park-ui.com/
- HeroUI: https://heroui.com/en/docs/react/getting-started
- Mantine theming: https://mantine.dev/theming/mantine-provider/
- MUI theming: https://mui.com/material-ui/customization/theming/
- Ant Design theming: https://ant.design/docs/react/customize-theme/

### Product references

- Shopee Thailand: https://shopee.co.th/
- Shopee search/recommendation: https://help.shopee.co.th/portal/4/article/143028
- Shopee reviews: https://help.shopee.co.th/portal/4/article/80883
- Duolingo learning overview: https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/
- Duolingo core tab redesign: https://blog.duolingo.com/core-tabs-redesign/
- Duolingo streak: https://blog.duolingo.com/how-duolingo-streak-builds-habit/
- Linear brand: https://linear.app/brand
- Linear redesign, historical 2024 reference: https://linear.app/now/how-we-redesigned-the-linear-ui
- Linear display options: https://linear.app/docs/display-options
- Linear select issues: https://linear.app/docs/select-issues
- Airbnb product entry: https://www.airbnb.com/
- Airbnb about: https://news.airbnb.com/about-us
- Airbnb filters: https://www.airbnb.com/help/article/479
- Airbnb pricing: https://www.airbnb.com/help/article/125
- Airbnb search: https://www.airbnb.com/help/article/39
- Airbnb location visibility: https://www.airbnb.com/help/article/2141
- Airbnb 2025 release, historical design context: https://news.airbnb.com/en-uk/2025-summer-release-now-you-can-airbnb-more-than-an-airbnb
- Airbnb 2026 release: https://news.airbnb.com/th/2026-summer-release-now-theres-even-more-to-airbnb

## 28. คำสั่งส่งต่อพร้อมเริ่มงาน

> ใช้เอกสารนี้เป็น Project brief และ Architecture context ตรวจ Repository และ Dependencies ก่อน แล้วเริ่มสร้าง MVP ของ Intent Studio ตามขอบเขตในหัวข้อ 19
>
> ให้เริ่มจาก Semantic contract กับสอง Curated profiles ที่ปรับด้วยมือ ทำ Shared components และหนึ่ง Task pattern ให้ใช้งานได้ก่อนต่อ Interpreter อย่าใช้ LLM สุ่ม CSS ราย Component
>
> UX หลักต้องให้ผู้ใช้ใส่ Brand/Requirement เลือกความรู้สึก เห็น Preview ที่ต่างจริง ปรับต่อ ดูการ Mapping และยืนยัน/Export Profile ได้ รายละเอียด Architecture ให้เป็นมุมมองรอง
>
> รักษาการแยก Behavior, Tokens, Recipes, Patterns, Graphics และ Domain data ใช้ Source ของ shadcn เป็นฐานตามเวอร์ชันที่เลือก และสร้าง Catalog/Contract ของทีมเพื่อให้ AI ใช้งานถูก
>
> แจ้ง Assumptions ที่ยังไม่มีคำตอบ แล้วเดินหน้าด้วย Default ที่ระบุไว้ การเลือก Hosting, AI provider, Figma sync และ Multi-tenant backend ยังไม่จำเป็นต่อการพิสูจน์ MVP
>
> ส่งมอบโค้ดที่ทำงานได้ หลักฐานการตรวจที่เหมาะสม และรายการข้อจำกัดจริง พร้อมอธิบายว่าแต่ละ Layer ทำอะไรและเปลี่ยน Profile ผ่านตรงไหน

