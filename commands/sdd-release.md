---
description: 发版 / 升版本号 / 打 tag（走 sdd-release-version）
argument-hint: "[目标版本，可留空让其按 commit 推导]"
---

发布版本（目标 **$ARGUMENTS**，留空则按 commit 推导 SemVer）。用 **sdd-release-version** 技能——先阻断验证（构建 + 测试全绿）、按 commit 定 SemVer、CHANGELOG 先行、同步文档与 FR 状态（标 `已交付@vX.Y.Z`）、再打**本地** tag。**永不 push**（推送由你决定）。
