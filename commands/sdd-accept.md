---
description: 验收（整期 / 版本 / 改动够不够格发版或合并）（走 sdd-accept-phase）
argument-hint: "[scope: phase | version | changes，默认 version]"
---

验收当前 SDD 项目（scope = **$ARGUMENTS**，留空默认 version）。用 **sdd-accept-phase** 技能——对照 PRD §4 FR 表 + §6 / 各 spec 验收标准**逐条核**（测试绿 + 真机证据，`测试绿 ≠ 真能用`），产出通过 / 差距报告；不过的路由到 sdd-fix-bug，全过才放行（发版 / 合并）。
