# Privacy Impact Assessment — Research Data Template

> Required for datasets with `privacy_sensitivity` of "high" or "restricted".
> Aligned with POPIA (South Africa) and GDPR (EU).

---

## 1. Dataset Identification

| Field | Value |
|-------|-------|
| **Dataset ID** | DS-XXXX-description |
| **Dataset Name** | |
| **Assessor** | |
| **Date** | YYYY-MM-DD |
| **Status** | Draft / Under Review / Approved / Rejected |

---

## 2. Personal Data Inventory

| Data Element | Type | Sensitivity | Justification |
|-------------|------|-------------|---------------|
| | Location / Name / ID / Address / etc. | Low / Medium / High | Why is this field needed? |

---

## 3. Purpose & Lawful Basis

- **Purpose:** (Describe the specific research purpose)
- **Lawful basis:** consent / contract / legal obligation / legitimate interests
- **Data minimization:** (How is data limited to what's necessary?)
- **Proportionality:** (Is the privacy impact proportionate to the research benefit?)

---

## 4. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Re-identification from spatial data | Low/Med/High | Low/Med/High | |
| Movement pattern inference | Low/Med/High | Low/Med/High | |
| Residential address derivation | Low/Med/High | Low/Med/High | |
| Data breach / unauthorized access | Low/Med/High | Low/Med/High | |
| Cross-dataset linkage | Low/Med/High | Low/Med/High | |

---

## 5. Privacy-Preserving Measures

- [ ] Spatial aggregation (grid cells, admin boundaries)
- [ ] K-anonymity applied (k = ___)
- [ ] Differential privacy (ε = ___)
- [ ] Coordinate jittering / fuzzing
- [ ] Temporal aggregation
- [ ] Pseudonymization
- [ ] Data access controls (RLS / role-based)
- [ ] Encryption at rest
- [ ] Audit logging enabled

---

## 6. Data Subject Rights (POPIA §§ 23–25)

- [ ] Access: subjects can request their data
- [ ] Correction: subjects can correct inaccurate data
- [ ] Deletion: subjects can request data deletion
- [ ] Objection: subjects can object to processing
- [ ] Process documented for handling subject requests

---

## 7. Retention & Disposal

- **Retention period:** ___
- **Disposal method:** Secure deletion / anonymization
- **Review date:** YYYY-MM-DD

---

## 8. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Data Controller | | | |
| Privacy Officer | | | |
| Research Lead | | | |

---

## 9. Audit Trail

| Date | Action | By |
|------|--------|----|
| | PIA created | |
| | | |
