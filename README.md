# Hyeri Thailand FC ♡

บ้านแฟนคลับคนไทย (ไม่เป็นทางการ) ของ **ฮเยริ (혜리 / Lee Hye-ri)** มี 3 ภาษา TH / EN / KR
ชื่อบ้านแฟนคลับตั้งค่าไว้ที่ `data/site.json` → `brand.name` (แก้ได้จากหน้า Admin → แก้ไขข้อความ → ตั้งค่าเว็บ แล้วโลโก้ ชื่อแท็บ และข้อความทุกภาษาจะเปลี่ยนตาม)
โฮสต์ฟรีบน GitHub Pages ไม่ต้องเช่าเซิร์ฟเวอร์ และมีหน้า Admin ที่สั่งให้ Claude AI อัปเดตข้อมูลหรือสร้างหน้าใหม่ได้

- หน้าเว็บ: <https://hyerithailandfc.github.io/>
- หน้าแอดมิน: <https://hyerithailandfc.github.io/admin/>
- repo: <https://github.com/hyerithailandfc/hyerithailandfc.github.io> (อยู่ใน GitHub Organization `hyerithailandfc`
  ชื่อ repo ต้องเป็น `<ชื่อองค์กร>.github.io` ลิงก์เว็บถึงจะไม่มีชื่อ repo ต่อท้าย)
- กฎการสร้าง/ธีมสำหรับ Claude: [CLAUDE.md](CLAUDE.md) และโฟลเดอร์ [docs/](docs/)

---

## ติดตั้งครั้งแรก (ทำครั้งเดียว ~15 นาที)

### 1. สร้าง repo และอัปโหลดไฟล์
1. ไปที่ <https://github.com/new> ตั้งชื่อ repo เช่น `hyeri-fansite` เลือก **Public** (GitHub Pages ฟรีต้องเป็น public) ไม่ต้องติ๊กสร้าง README
2. ในโฟลเดอร์โปรเจกต์ รัน (เปลี่ยน `<USER>` เป็นชื่อผู้ใช้ GitHub):
   ```bash
   git init -b main
   git add .
   git commit -m "Initial fansite"
   git remote add origin https://github.com/<USER>/hyeri-fansite.git
   git push -u origin main
   ```

### 2. เปิด GitHub Pages
repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / `(root)` → Save
รอ 1–2 นาที เว็บจะขึ้นที่ `https://<USER>.github.io/hyeri-fansite/`

### 3. อนุญาตให้ GitHub Actions เขียน repo และเปิด PR ได้
repo → **Settings → Actions → General → Workflow permissions**
- เลือก **Read and write permissions**
- ติ๊ก **Allow GitHub Actions to create and approve pull requests** → Save

### 4. เชื่อม Claude (ใช้แพ็กเกจ Claude Pro/Max ที่มีอยู่ ไม่เสียเงินเพิ่ม)
1. ในเทอร์มินัลรัน:
   ```bash
   claude setup-token
   ```
   ล็อกอินในเบราว์เซอร์ แล้วคัดลอก token ที่ได้ (ขึ้นต้นด้วย `sk-ant-oat…`)
2. repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `CLAUDE_CODE_OAUTH_TOKEN`
   - Secret: วาง token → Add secret

### 5. เชื่อม TMDB และ YouTube (ฟรี ใช้ดึงโปสเตอร์ เรื่องย่อ รูป และ MV)
**TMDB**
1. สมัครบัญชีที่ <https://www.themoviedb.org/signup>
2. ไปที่ <https://www.themoviedb.org/settings/api> → ขอ API key แบบ **Developer** (กรอกว่าเป็นแฟนไซต์ไม่แสวงหากำไร)
3. คัดลอก **API Key** (หรือ **API Read Access Token** ก็ได้ ใช้ได้ทั้งสองแบบ)
4. repo → Settings → Secrets and variables → Actions → New repository secret → Name: `TMDB_API_KEY`

**YouTube Data API**
1. ไปที่ <https://console.cloud.google.com/> → สร้างโปรเจกต์ใหม่ (เช่น `hyeri-fansite`)
2. เมนู **APIs & Services → Library** → ค้นหา **YouTube Data API v3** → Enable
3. **APIs & Services → Credentials → Create credentials → API key** → คัดลอก key
   - กด Edit key → **Application restrictions: None** (ห้ามตั้งเป็น "Websites/HTTP referrers" เพราะ GitHub Actions เรียกจากเซิร์ฟเวอร์ ไม่มี referrer จะโดนบล็อก 403)
   - **API restrictions: Restrict key** → เลือกเฉพาะ **YouTube Data API v3** (กันไม่ให้ key ถูกเอาไปใช้กับบริการอื่น)
4. เพิ่ม secret ชื่อ `YOUTUBE_API_KEY`

จากนั้นไปที่ repo → **Actions → Sync TMDB & YouTube → Run workflow** เพื่อดึงข้อมูลครั้งแรก (หรือกดปุ่มในหน้า Admin)
ระบบจะดึงใหม่อัตโนมัติทุกวันจันทร์ — ถ้าไม่ใส่ key ไหน ระบบจะข้ามส่วนนั้นไป เว็บยังใช้งานได้ปกติ

> ถ้า TMDB จับคู่ละครผิดเรื่อง หรือ YouTube เลือกคลิปผิด: แท็บ **แก้ไขข้อความ** → ผลงาน → ใส่ `tmdbId` (เลขในลิงก์ TMDB) หรือ `youtubeId` (11 ตัวท้ายลิงก์ YouTube) ในรายการนั้น แล้วกดดึงข้อมูลใหม่

### 6. สร้าง token สำหรับล็อกอินหน้า Admin
1. GitHub → รูปโปรไฟล์ → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. ตั้งค่า:
   - Expiration: ตามสะดวก (เช่น 90 วัน)
   - Repository access: **Only select repositories** → เลือก `hyeri-fansite`
   - Permissions → Repository permissions:
     - **Contents**: Read and write
     - **Issues**: Read and write
     - **Pull requests**: Read and write
     - **Actions**: Read and write (ใช้กดปุ่ม “ดึงข้อมูลใหม่ตอนนี้”)
3. Generate แล้วคัดลอก token (`github_pat_…`) ไปวางในหน้า Admin
   > token นี้เก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น ห้ามแชร์ให้ใคร ถ้าหลุดให้ลบทิ้งที่หน้าเดิมแล้วสร้างใหม่

---

## ใช้งานหน้า Admin

| แท็บ | ใช้ทำอะไร | ต้องใช้ Claude ไหม |
|---|---|---|
| **ภาพรวม** | ดูคำขอ, งานที่ Claude ทำเสร็จรอตรวจ (PR) → กด **เผยแพร่** หรือ **ทิ้ง** · สถานะ TMDB/YouTube + ปุ่มดึงข้อมูลใหม่ · ผลงานบน TMDB ที่เว็บยังไม่มี | — |
| **อัปเดตจาก namu.wiki** | คัดลอกส่วนที่เปลี่ยนจาก namu.wiki มาวาง → Claude แปล 3 ภาษาและอัปเดตข้อมูล | ✅ |
| **สั่ง Claude ทำงาน** | ขอหน้าใหม่ ฟีเจอร์ใหม่ ปรับดีไซน์ แก้บั๊ก (พิมพ์ภาษาไทยได้) | ✅ |
| **แก้ไขข้อความ** | แก้ข้อความ/ข้อมูลโดยตรง บันทึกแล้วขึ้นเว็บทันที | ❌ |
| **รูป & วิดีโอ** | อัปโหลดรูป (ย่อเป็น WebP อัตโนมัติ), เพิ่มวิดีโอ YouTube | ❌ |

**ขั้นตอนเมื่อสั่ง Claude:** ส่งคำขอ → Claude ทำงานใน GitHub Actions (~3–10 นาที) → ตอบกลับเป็นภาษาไทยในคำขอ + เปิด PR → ไปแท็บ **ภาพรวม** กด “ดูไฟล์ที่เปลี่ยน” ตรวจ → กด **เผยแพร่**
ถ้าอยากให้แก้เพิ่ม กด **ส่งข้อความเพิ่ม** ที่คำขอนั้น Claude จะแก้ใน PR เดิม

> ทำไมไม่ดึงข้อมูลจาก namu.wiki อัตโนมัติ? — namu.wiki บล็อกบอต (ตอบ 403) การเลี่ยงระบบป้องกันของเขาไม่เหมาะสม จึงใช้วิธีให้แอดมินคัดลอกส่วนที่เปลี่ยนมาแทน

---

## ดูตัวอย่างในเครื่อง (Windows)
```bash
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```
แล้วเปิด <http://localhost:8080/>

## ตรวจความถูกต้องของข้อมูล
GitHub Actions รัน `node tools/validate.mjs` ให้อัตโนมัติทุกครั้งที่มีการ push (ถ้ามี Node.js ในเครื่องก็รันเองได้)

## โครงสร้าง
```
index.html              โครงหน้าเว็บ
assets/css/main.css     ธีมและดีไซน์ทั้งหมด
assets/js/              แกนหลัก + โมดูลแต่ละหน้า (pages/)
data/                   ข้อมูลทั้งหมด (JSON 3 ภาษา) ← หน้า Admin แก้ไฟล์เหล่านี้
admin/                  หน้าแอดมิน
images/gallery/         รูปที่แอดมินอัปโหลด
docs/                   กฎการออกแบบ เนื้อหา ขั้นตอนของ Claude และบันทึกการเปลี่ยนแปลง
.github/workflows/      Claude builder + validator
```

## ลิขสิทธิ์
- เนื้อหาสรุป/แปลจาก [namu.wiki — 혜리](https://namu.wiki/w/%ED%98%9C%EB%A6%AC) ภายใต้ [CC BY-NC-SA 2.0 KR](https://creativecommons.org/licenses/by-nc-sa/2.0/kr/) เนื้อหาเว็บนี้จึงใช้สัญญาอนุญาตเดียวกัน (ห้ามใช้เชิงพาณิชย์)
- เว็บไซต์โดยแฟน ไม่มีส่วนเกี่ยวข้องกับฮเยริหรือต้นสังกัด Sublime
