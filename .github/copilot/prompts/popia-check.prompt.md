---
description: Run a POPIA compliance check on a file or component.
name: popia-check
tools: ['codebase', 'search']
---

Perform a POPIA (Protection of Personal Information Act) compliance check on the specified file or component.

Follow the `.github/skills/popia_compliance/SKILL.md` checklist:

1. **Identify all personal information** the file handles.
2. **State the purpose** for each data item.
3. **Identify the lawful basis** (consent, contract, legal obligation, vital interests, public interest, legitimate interests).
4. **Check data minimisation** — are we collecting more than necessary?
5. **Check retention & deletion** — is there a retention policy?
6. **Check security measures** — RLS, auth, no client-side exposure.
7. **Check data subject rights** — access, correction, deletion, objection.
8. **Check audit logging** — significant actions logged?

Produce a compliance summary:
- ✅ COMPLIANT items
- ⚠️ REQUIRES ATTENTION items
- 🚨 ESCALATE TO LEGAL items

If the `[POPIA]` header comment is missing, add it.
