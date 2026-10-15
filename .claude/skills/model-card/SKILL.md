---
name: model-card
description: Write or update a model card for a physics model. Use whenever a model is added or its equations, range or data change.
---
Use the template in programme/MASTER.md Appendix C. Save as docs/model-cards/<id>.md with id matching ModelCard.id in code. Fill: reality badge, equations, assumptions and valid range, numerical method and timestep, couplings in and out, data sources (every number sourced or flagged "est."), validation benches with latest results, known limits, and a player-facing summary of at most 60 words in en-GB. Make sure the DomainModule.modelCards() entry and the Lab Book reference the same id.
