# AZ-Maroc-AI — Mathematical Formulation



Date: 2026-09-23

Status: pre-experimental formulation



## 1. Purpose



This document formalizes the experimental residue after the KILL-FIRST

prior-art analysis and the subsequent counterexample attacks.



The formulation precedes the AZ-Maroc-AI scientific experiment.



Several earlier definitions were rejected during the counterexample

phase. They are recorded at the end of this document.



## 2. Experimental trial



Let j denote one controlled experimental trial.



Let:



S_j = controlled task state



C_j = task constraints



H_ext,j = all externally supplied information available during the

relevant pre-interruption history



M_pre,j = controlled persistent memory present before the trial



Q_j = complete experimental checkpoint from which causal branches are

derived



The operational content of Q_j must be established by the AZ runtime

audit before experimentation.



## 3. Valid continuations



Let:



V(S_j,C_j)



be the set of successful continuation traces allowed by state S_j and

constraints C_j.



The first experiment requires:



|V(S_j,C_j)| >= 2



A continuation v is a trace rather than necessarily a single action:



v = (a1,a2,...,an)



This permits prescriptions concerning ordering, eventual behavior or

other trace-level relations to be evaluated.



## 4. Prescription satisfaction



For a candidate memory item m, define:



Sat(v,m) in {0,1}



Sat(v,m) = 1 if continuation trace v satisfies the behavioral relation

expressed by m.



Sat(v,m) = 0 if v violates that relation.



The satisfaction rule for m must be defined before its causal outcome is

examined.



If no sufficiently unambiguous satisfaction rule can be defined:



Ambiguous(m) = 1



and m is excluded from admissible prescription analysis.



## 5. Task non-necessity



Define:



TaskNonNec(m,S_j,C_j) = 1



iff there exists v in V(S_j,C_j) such that:



Sat(v,m) = 0



Because v belongs to V(S_j,C_j), it is already a successful continuation.



Therefore m is not logically necessary for successful completion of the

controlled task.



TaskNonNec concerns necessity imposed by the task.



It does not imply that m is unnecessary to the current policy of the

agent.



TaskNonNec != AgentNec



An experimentally interesting case may occur precisely when a

task-non-necessary prescription becomes behaviorally important to the

agent.



## 6. Controlled origin conditions



AgentWrite(m,j) = 1



means that the agent writes m into continuation memory during trial j.



This does not claim that the underlying concept was created ex nihilo by

the agent.



Define:



ExtPresc(m,H_ext,j) = 1



if a prescription equivalent to m is explicitly supplied or is

derivable under the predefined semantics of the controlled benchmark

from externally supplied information.



Define:



PreMemEq(m,M_pre,j) = 1



if an equivalent prescription already exists in the controlled

pre-trial persistent memory.



The admissible case requires:



ExtPresc(m,H_ext,j) = 0



and:



PreMemEq(m,M_pre,j) = 0



The experiment therefore tests generation during the observed execution

without an equivalent controlled external or pre-existing memory

prescription.



It does not establish that no latent internal structure contributed to

generation.



## 7. Admissible generated prescription



A candidate m is admissible when:



PA(m,j) = 1



iff:



AgentWrite(m,j) = 1

AND Presc(m) = 1

AND DNeed(m) = 0

AND Req(m,C_j) = 0

AND TaskNonNec(m,S_j,C_j) = 1

AND ExtPresc(m,H_ext,j) = 0

AND PreMemEq(m,M_pre,j) = 0

AND Adv(m,H_ext,j) = 0

AND Ambiguous(m) = 0



PA determines admissibility before the causal outcome is known.



## 8. Generation



For trial j:



G_j = 1



iff at least one m exists such that:



PA(m,j) = 1



Otherwise:



G_j = 0



For N controlled trials:



G_rate = (1/N) * sum_j G_j



The number of admissible prescriptions generated in each trial is also

recorded separately:



CountPA_j



Therefore trial-level generation frequency is not confused with the

total number of generated prescriptions.



If multiple admissible prescriptions occur in one trial, they are not

automatically treated as independent experimental observations.



## 9. Prescription decomposition



For causal intervention, the relevant memory content is represented as:



m = (d,r)



where:



d = descriptive base content



r = prescriptive relation



Example:



d = Pending={R2,R4}



r = Priority=R4>R2



This decomposition replaces the stronger and potentially unrealizable

requirement that a descriptive control be semantically equivalent to the

complete prescription.



## 10. Causal branches



All causal branches originate from exact clones of one common

checkpoint Q_j before intervention.



Define:



I_A = retain original prescription



I_B = remove the prescription



I_C = replace the prescriptive relation with a structurally matched

neutral control n



I_D = retain the descriptive base d without the prescriptive relation r



Thus:



A = d + r



B = prescribed removal condition



C = d + n



D = d



The neutral content n should match relevant non-semantic properties of r

as closely as the protocol permits, including predefined properties such

as format, position and size.



## 11. Checkpoint condition



Before intervention:



Clone_A(Q_j)

=

Clone_B(Q_j)

=

Clone_C(Q_j)

=

Clone_D(Q_j)



After intervention:



Q_X,j(0) = I_X(Clone_X(Q_j))



for X in {A,B,C,D}.



The branches are expected to differ after intervention.



Only the direct intervention is controlled.



Native downstream consequences produced by AZ after the intervention are

part of the causal pathway and must not be manually neutralized.



## 12. Branch isolation



Define:



Leak_j = 0



when no mutable branch state can influence another experimental branch.



The experiment additionally requires replay fidelity.



For an unmodified deterministic replay from two exact clones of Q_j:



Trace(Clone_1(Q_j)) = Trace(Clone_2(Q_j))



must hold under the predefined replay comparison.



Failure of required checkpoint fidelity or branch isolation makes the

corresponding causal comparison non-identifiable.



## 13. Behavioral outcome



Let:



T_X,j(k)



be the continuation trace observed in branch X from resumption through

predefined horizon k.



Let:



Opp_X,j(k) = 1



when the trace contains a predefined opportunity relevant to satisfying

or violating m_j.



When the outcome is defined:



Y_X,j(k) = Sat(T_X,j(k),m_j)



where:



Y_X,j(k) in {0,1}



If the required behavioral opportunity does not occur or the outcome

cannot be evaluated:



Y_X,j(k) = NA



NA must never be converted to zero.



## 14. Individual causal contrasts



When the required outcomes are defined:



TE_j(k) = Y_A,j(k) - Y_B,j(k)



DE_j(k) = Y_A,j(k) - Y_D,j(k)



SE_j(k) = Y_A,j(k) - Y_C,j(k)



Interpretation:



TE = total contrast relative to removing the prescription



DE = contrast beyond the retained descriptive base



SE = contrast beyond the structurally matched neutral addition



Each individual contrast belongs to:



{-1,0,+1}



A positive value is directionally compatible with increased satisfaction

of m.



A negative value is an anti-prescriptive directional effect.



Zero indicates no directional difference for that contrast at the

specified outcome and horizon.



## 15. Directional effect and causal displacement



Cancellation across trials must not be mistaken for absence of causal

change.



For example:



{+1,+1,-1,-1}



has mean directional effect zero while every trial contains a branch

difference.



Therefore both directional contrasts and absolute displacement are

recorded.



For example:



MeanTE(k) = (1/N_k) * sum_j TE_j(k)



ChangeTE(k) = (1/N_k) * sum_j |TE_j(k)|



where N_k includes only trials satisfying the predefined identification

and outcome conditions for that analysis.



Equivalent summaries may be recorded for DE and SE.



The final aggregation and uncertainty procedure must be frozen in the

experimental protocol before scientific data are analyzed.



## 16. Prescriptive-specific evidence



No single contrast is sufficient by itself to establish a

prescriptive-specific effect.



Evidence must be evaluated jointly across the predefined comparisons:



TE

DE

SE



The protocol must predefine:



epsilon_TE

epsilon_DE

epsilon_SE



or another explicit decision rule before scientific results are

collected.



A positive compliance interpretation additionally requires a

predefined direction consistent with satisfaction of m.



An effect in the opposite direction remains a causal observation but is

classified as anti-prescriptive rather than compliant.



## 17. Identification



Define:



Identifiable_j(k) = 1



only when all required identification conditions for the comparison are

satisfied.



These include at minimum:



CheckpointExact_j = 1



ControlledIntervention_j = 1



Leak_j = 0



ReplayFidelity_j = 1



OutcomeDefined_j(k) = 1



and any additional conditions frozen in the experimental protocol.



If identification fails:



Identifiable_j(k) = 0



and the result is:



NON-IDENTIFIABLE



It must not be reported as a zero causal effect.



## 18. Textual persistence and causal persistence



Textual persistence and causal persistence are distinct.



Define:



TP_m(k) = 1



when the relevant prescription remains textually present at the

predefined horizon k under the protocol's memory inspection rule.



Causal persistence concerns whether an effect attributable to the

prescription transmitted through resumption remains detectable at a

predefined horizon.



Therefore:



TP != CP



Possible cases include:



TP = 1 and CP = 0



or:



TP = 0 and CP = 1



The latter can occur when the transmitted prescription affects an early

action, disappears textually, but leaves downstream causal consequences.



## 19. Meaning of causal persistence



CP(k) does not mean that m necessarily remains directly causally active

at the exact horizon k.



It means that an effect attributable under the experimental design to

the transmission of m across interruption and resumption remains

detectable at the predefined horizon.



Direct continued causal activity would require a stronger experimental

design with additional intermediate interventions.



The present experiment does not make that stronger claim.



## 20. Predefined horizons



Let:



K_pre = {k1,k2,...,kr}



be the set of persistence horizons fixed before scientific result

analysis.



The protocol must also define:



HorizonUnit



and the opportunity rule used to determine whether the behavioral

outcome is evaluable.



All predefined horizons are reported.



Horizons must not be selected retrospectively because they produce a

favorable effect.



## 21. Effect at an horizon versus continuous effect



If required by the final protocol, define:



E_j(k) = 1



when the predefined causal-effect criterion is satisfied at horizon k.



Then:



EffectAt_j(k) = E_j(k)



A stronger continuous-effect quantity may be defined as:



Continuous_j(k) = product over eligible predefined horizons h <= k of

E_j(h)



However, continuous persistence is not assumed to be the primary

quantity because some prescriptions do not provide a relevant behavioral

opportunity at every intermediate horizon.



The protocol must distinguish these concepts before data collection.



## 22. Natural determinism



The experiment does not require AZ-Maroc-AI to be stochastic.



No artificial randomness will be added merely to create probability

distributions.



For deterministic execution, branch outcomes Y_X,j(k) remain valid.



Replication can be obtained across controlled task instances and

experimental trials.



If AZ contains a natural controllable stochastic component, an

additional probabilistic analysis may be defined before data collection.



## 23. Scope of causal interpretation



The experiment estimates the effect of transmitting or manipulating the

prescription at the interruption/resumption boundary.



It does not identify the original internal cause that led the agent to

generate m.



A latent internal variable Z may influence both generation of m and

other aspects of agent behavior.



The common-checkpoint branch intervention addresses the causal effect of

transmitting m, not the causal origin of m.



## 24. Rejected formulations



The counterexample phase rejected or weakened several earlier

formulations.



### 24.1 NonNec without task qualification



Rejected because task necessity and agent-policy necessity are different.



Replacement:



TaskNonNec



### 24.2 ExtEq(m,H_ext)



Rejected as insufficient because an external prescription may be

implicit, distributed or derivable, and equivalent content may already

exist in pre-trial persistent memory.



Replacement:



ExtPresc(m,H_ext)

\+

PreMemEq(m,M_pre)



under controlled benchmark semantics.



### 24.3 DescEq(A,D)



Rejected as potentially unrealizable because preserving complete

semantics while removing all prescriptive force may be contradictory.



Replacement:



m = (d,r)



with:



A = d+r

D = d



and an independent structural control C.



### 24.4 PE = A-D as sole prescriptive effect



Rejected because A-D alone cannot exclude structural intervention

effects.



Replacement:



joint analysis of TE, DE and SE.



### 24.5 Mandatory probability formulation



Rejected because AZ may be deterministic.



Replacement:



trial-level outcomes Y_X,j(k), with aggregation across controlled trials.



### 24.6 SameState(A,B,C,D)



Rejected as too vague.



Replacement:



common checkpoint

\+ exact pre-intervention clones

\+ predefined branch interventions

\+ branch isolation

\+ replay fidelity.



### 24.7 Simple CP threshold



Rejected because an effect observed at a later horizon does not prove

that the prescription remains directly active at that horizon, and

behavioral opportunities may differ across horizons.



Replacement:



explicit distinction between textual persistence, causal transmission

effect, opportunity, predefined horizons and any stronger continuous

persistence criterion.



## 25. Pre-experimental status



This formulation has survived the counterexample analysis recorded

before the AZ-Maroc-AI experiment.



Its operational feasibility has not yet been established.



The next stage is an audit of the existing AZ-Maroc-AI runtime to

determine whether exact checkpointing, restoration, branch isolation,

controlled memory intervention, replay fidelity, horizon measurement and

raw experimental logging are already supported.



No cognitive capability should be added merely to force a positive

scientific result.
