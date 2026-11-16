# ArtPraxis — Artist Rights, Creative Content & AI Data Governance
**Status:** Proposed project policy; technical enforcement and legal review pending  
**Date:** 2026-11-15  
**Owner:** ArtPraxis  
**Applies to:** Product design, development, research, AI prompts, model/provider calls, lesson generation, dataset creation, model fine-tuning, content acquisition, classroom/creator features, and contractors.

> **Foundational principle:** ArtPraxis exists to help people learn physical art-making and to value artists' expertise. We learn techniques; we do not appropriate the expression, labor, or livelihood of creators.

## 1. Hard restrictions — default DENY
1. **No third-party copyrighted work in model training, fine-tuning, embeddings/RAG corpora, persistent reference libraries, or automated dataset creation without verified rights for that specific use and legal review.** Publicly posted is not public domain. Fair use is not a default permission or a data-acquisition strategy. Record any exceptional legal basis and review *before* use.
2. **No unauthorized automated Instagram/social-platform access, downloads, scraping, circumvention of access restrictions, or bulk collection.** Respect platform terms, creator preferences, copyright, and privacy rights. A user-provided URL does not establish a license.
3. **No copying third-party footage, imagery, compositions, specific expressive artwork, text, captions, original diagrams, signature illustrations, audio, music or demonstrations into ArtPraxis outputs or marketing without rights.** Avoid misleading 'in the style of [living artist]' imitation and near-duplicate visual outputs even where legal outcome is unsettled.
4. **No removing credits, embedded provenance, metadata or copyright-management information to hide origins.**
5. **No sending third-party creative media to generative AI APIs or other external processors solely for research without documented authorization, applicable terms review, and a necessity/privacy assessment.** Uploading a video to this chat for our analysis is not equivalent to creator consent for commercial reuse or training.
6. **No student education records or child data in model training, analytics beyond authorized educational purpose, advertising, or cross-customer datasets.** Teacher-facing mode first; school/student features require privacy review before collection.
7. **No hidden training consent or retroactive changes to rights granted by users and creators.** Make any improvement/training use a separate, understandable, opt-in choice (off by default).

## 2. Distinguish uses of AI precisely
- **Human learning/research:** A researcher lawfully views public educational material and writes independent notes about uncopyrightable techniques/processes (e.g., glaze over dry underpainting, brush angle, wash control). Cite the discovery source internally. Reexpress instruction originally, from understanding and independently checked art knowledge.
- **Inference to deliver a user-requested lesson:** A submitted user-owned/authorized reference may be temporarily processed by approved AI providers solely to perform the requested lesson. Must have necessary rights, appropriate privacy disclosures, and vendor data processing terms. This is *not* the same as model training; assess any external content sent with prompts, retention and storage.
- **Embedding, vector storage, RAG, datasets, fine-tuning, model training/evaluation:** These can involve reproduction, retention and downstream reuse even when the base model is not retrained. Require additional rights and approvals, provenance records and minimization. Do not assume these uses are permitted because content was publicly viewable or uploaded for a single lesson.
- **Featuring or selling an artist's video/content:** Requires an appropriate license covering display, hosting, edits, derivative clips, marketing, territories, duration, compensation, and removal process, and may require rights for music/persons appearing in media.

## 3. Permitted content categories
A. ArtPraxis original instructional text, media and demonstrations whose rights are documented.  
B. Works whose rights have been verified as public domain (including jurisdiction and source authenticity).  
C. Properly licensed Creative Commons or other third-party material *only* when the specific license permits the contemplated commercial, AI, adaptation, attribution and redistribution uses; **NC/ND and other restrictions must be respected**.  
D. Artist/creator-submitted works under explicit, purpose-specific written permission, including payment if agreed.  
E. User uploads for their own lesson only: limited license to process and serve the requested functionality, subject to user rights and privacy. Any separate model improvement use requires separately consented opt-in and rights checks.

**If uncertain: quarantine and do not ingest, distribute, feature, or train on it.**

## 4. Source registry & audit trail
For every external source evaluated record:
- URL/source platform, creator and rights holder, title, date reviewed, reviewer, technique abstracted and independent corroboration;
- access method; copyright and platform status; permission agreement link, allowed uses, territory/duration/compensation/attribution, restrictions; contact and opt-out requests;
- asset identifiers and retention/deletion status; whether any media was sent to a third-party provider; exact purpose and provider; request/inference vs training distinction;
- license expiry, complaints/takedowns and resolutions, modifications, and any AI-generated output similarity concerns.

Maintain an **allowlist only** for approved machine-ingested content. Unreviewed Instagram reels are *research pointers*, not approved data sources.

## 5. Creator partnerships & integrity
- Secure informed written consent before licensing media, model training, instructor likeness/voice, paid demos or publishing instructional content.
- Offer appropriate credit, transparent fee or revenue share, creator review, and complaints/removal channel. No assertion of partnership or endorsement without permission.
- Use creator expertise as knowledge with original instructional wording, proper technical validation, and independent pedagogical judgment; do not clone a creator's artwork or distinctive sequence of expressive examples.
- Make AI-vs-human creation and verification labels clear. Do not claim human validation without it.
- Follow licensing terms for music, soundtrack, recognizable people, and artworks appearing in creator videos.

## 6. User/student trust & privacy
- Users retain ownership of their reference images and painted artwork, subject to rights they hold.
- Require clear upload rights representation; provide a copyright report and takedown path, dispute handling, deletion/export controls, appropriate retention limits, and vendor disclosures.
- Provider API 'not used for provider model training by default' is a **vendor contract/data policy fact**, not a promise of no retention: review each endpoint, default abuse-monitoring retention, application state, logs, and any opt-ins at integration time.
- Keep training/secondary reuse off by default. Separate optional improvement consent from necessary generation, avoid dark patterns, and record when it was granted.
- For K–12: before student accounts or student PII, conduct FERPA/COPPA/California student privacy (including SOPIPA) legal/technical review; obtain school approvals/appropriate agreements and minimize collection.

## 7. Development gates (blocking)
**Gate A — Evidence:** Technique traceable to genuine accessible source; do not hallucinate video content.  
**Gate B — Rights:** Source/license records checked; no unauthorized ingestion or platform circumvention.  
**Gate C — Quality:** Original wording/artwork, faithful physical technique, no uncredited or near-duplicate copying.  
**Gate D — Data:** Collection/retention/API use documented; training off; privacy terms compliant.  
**Gate E — Release:** Human audit, test cases, complaints channel and legal review for higher-risk features.  

Code/release acceptance checks to create and verify:
- feature flags default external-content ingestion, training/fine-tuning, auto-download and dataset exports OFF;
- a data-rights gate rejects source ingestion unless approved use is recorded;
- tests cover rejected unapproved content and invalid/expired licenses;
- separate consent controls and audit entries for optional training, if ever implemented;
- metadata/credit preservation, prompt/output near-duplicate review workflow, takedown ability;
- no educator/student training pipeline absent legal approval.
**These controls are not yet verified as implemented in the repository. Do not claim compliance enforcement until audited.**

## 8. For the six submitted Instagram reels
Current status: **UNVERIFIED; research-only pointers; NO ingestion, fine-tuning, video reuse, or automated harvesting authorized.** A user-provided screenshot/recording likewise does not create commercial rights. First identify each creator and lawfully review public material as a human; produce original technique descriptions without copying expression. If media needs to be sent to an AI model for analysis, secure an appropriate license or alternative vetted basis first. Seek opt-in collaborations before any direct video integration.

## 9. Incident and change management
- Stop affected ingestion/feature; preserve non-content audit evidence and notify project owner.
- Review rights, notify rights holder or privacy stakeholders if required, promptly remove unauthorized content, assess downstream backups/model artifacts and legal obligations.
- Reassess for changes in federal/state laws, litigation, vendor and platform terms and international launch markets.
- Have qualified IP and privacy counsel review this policy, agreements and technical controls before public launch or institutional sales. The existence of this document is not legal certification.

## Primary references (reviewed November 2026)
- U.S. Copyright Act §102(b): https://uscode.house.gov/us/usc/119-124/t17/s102/
- U.S. Copyright Office AI study/Part 3: https://www.copyright.gov/ai/
- U.S. Copyright Office fair use: https://www.copyright.gov/fair-use/more-info.html
- Copyright management information §1202: https://www.law.cornell.edu/uscode/text/17/1202
- Instagram terms (current terms should be checked at time of use): https://help.instagram.com/581066165581870
- OpenAI API data controls: https://developers.openai.com/api/docs/guides/your-data
- U.S. FTC COPPA and schools: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- U.S. Department of Education FERPA guidance: https://studentprivacy.ed.gov/faq/i-want-use-online-tool-or-application-part-my-course-however-i-am-worried-it-violation-ferpa
