# AZ-Maroc-AI — KILL-FIRST Prior-Art Analysis



Date: 2026-09-23



## 1. Purpose



This document records the hostile prior-art examination performed before

the AZ-Maroc-AI experiment.



The purpose is to identify which parts of the original research idea are

already covered by existing work and to preserve only the experimental

question that remains unresolved by the literature examined.



No experimental result from AZ-Maroc-AI is used in this analysis.



## 2. Original broad hypothesis



The initial idea concerned an agent that can generate information or

instructions in its own persistent memory and later have its behavior

influenced by that memory.



This formulation is too broad.



Existing research already demonstrates several individual components:



- agents can construct reusable procedural memories;

- agents can extract rules or experience from previous trajectories;

- stored memories can influence later behavior;

- persistent memory can carry information across sessions;

- memory content can be evaluated through causal interventions;

- persistent instructions can alter later agent behavior;

- commitments, plans and previous reasoning can constrain future behavior.



The broad hypothesis is therefore rejected as a research contribution.



Status:



BROAD HYPOTHESIS = ELIMINATED



## 3. Procedural and self-generated memory



Work on procedural and experience-driven memory shows that agents can

construct reusable knowledge from their own trajectories.



Examples examined include ReMe and related procedural-memory systems.



These works absorb the general proposition:



"An agent can generate memory from its own experience and reuse it later."



This proposition is therefore not part of the surviving research claim.



What remains relevant is whether a prescription appears spontaneously

inside continuation memory even though successful execution does not

require that prescription.



## 4. Causal intervention on memory



Causal Memory Intervention (CMI) explicitly evaluates candidate memories

through controlled interventions and measures their influence on later

agent output.



This absorbs the general proposition:



"The causal effect of a memory can be studied by retaining, suppressing

or otherwise intervening on that memory."



Therefore, memory intervention itself is not treated as the distinctive

research object.



The surviving question requires a more specific causal object:

a self-generated, non-required prescription.



## 5. Persistent memory poisoning



Research on persistent memory poisoning demonstrates that instructions

stored in persistent memory can survive session boundaries and influence

later behavior.



MemSecBench studies the lifecycle from memory persistence to downstream

consequence.



PMPA demonstrates that malicious instructions originating in external

content can be written into persistent agent memory and trigger behavior

in later sessions.



These works absorb the general proposition:



"A persistent instruction can influence future behavior after a session

boundary."



However, their relevant causal seed is externally introduced or

adversarial.



The present experiment excludes that mechanism.



The prescription of interest must not have an equivalent externally

supplied prescription in the controlled history.



## 6. Commitments, plans and behavioral persistence



Related research on plans, commitments, premature commitment and

persistent behavioral tendencies further eliminates broad claims that

past internal state can constrain later action.



Consequently, this project does not study merely whether an agent can

commit to a plan or preserve a previous decision.



The experimental object must satisfy the stricter admissibility

conditions defined separately.



## 7. Surviving experimental residue



After the prior-art elimination, the remaining question is the following

combined chain:



1. The task is non-adversarial and controlled.



2. At least two successful continuations are known by construction.



3. The agent spontaneously generates a memory item m.



4. m has prescriptive rather than merely descriptive content.



5. m is not explicitly required by the task.



6. m is not necessary for successful task completion.



7. no equivalent prescription exists in the controlled external history.



8. m is written into continuation memory.



9. execution is interrupted and later resumed.



10. branches derived from the same experimental state manipulate only the

    relevant memory condition.



11. the retained prescription is compared with:

    A = original prescription,

    B = removed prescription,

    C = structurally matched neutral control,

    D = corresponding descriptive control.



12. total causal effect and specifically prescriptive causal effect are

    measured separately.



13. persistence is evaluated at predefined post-resumption horizons.



The research object is therefore the complete conjunction of these

conditions, not any individual component.



## 8. Strongest remaining threat



A future or previously missed study would absorb this residue if it

already demonstrated substantially the same complete experimental chain:



self-generated non-required prescription

→ persistent continuation memory

→ interruption/resumption

→ controlled causal manipulation

→ separation from descriptive and structural memory effects.



Finding such a study would require revising or abandoning the present

research direction.



## 9. Current KILL-FIRST verdict



Broad candidate:



ELIMINATED.



Narrow experimental residue:



SURVIVES THIS PRIOR-ART SEARCH.



The literature examined contains close precedents for procedural memory,

causal memory intervention, persistent memory influence, memory poisoning,

plans and commitments.



No exact equivalent of the complete surviving experimental chain was

identified in this search.



This verdict concerns the literature examined as of 2026-09-23.



It is not an experimental result.



The next stage is to formalize the surviving residue mathematically and

define conditions under which the AZ-Maroc-AI experiment can falsify it.



## 10. References examined



ReMe:

Remember Me, Refine Me: A Dynamic Procedural Memory Framework for

Experience-Driven Agent Evolution.

Findings of ACL 2026.



CMI:

Causal Intervention-Based Memory Selection for Long-Horizon LLM Agents.

2026.



MemSecBench:

Tracking Agent Memory Poisoning from Persistence to Consequence and

Repair.

2026.



PMPA:

When Malicious Instructions Persist:

Persistent Memory Poisoning Attack on Harness-Based Agents.

Submitted 2026-09-12.



Additional related families examined during the KILL-FIRST process

include procedural memory, self-generated rules, plan persistence,

premature commitment, policy shaping, persistent behavioral effects and

agent memory security.
